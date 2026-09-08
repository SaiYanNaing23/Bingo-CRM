"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listApplicationStageHistory = exports.transitionApplicationStage = exports.listApplications = exports.deleteApplication = exports.updateApplication = exports.getApplication = exports.createApplication = void 0;
const client_1 = require("../../../generated/prisma/client");
const prisma_1 = require("../../../lib/prisma");
const app_error_1 = require("../../../shared/errors/app-error");
const omit_undefined_1 = require("../../../shared/utils/omit-undefined");
const pagination_1 = require("../../../shared/utils/pagination");
const soft_delete_1 = require("../../../shared/utils/soft-delete");
const applications_dto_1 = require("../dto/applications.dto");
const applications_types_1 = require("../types/applications.types");
const notFound = () => new app_error_1.AppError("Application not found", 404, undefined, "APPLICATION_NOT_FOUND");
const transactionOptions = { maxWait: 10000, timeout: 15000 };
const requireApplicationDate = (stage, date) => {
    if ((0, applications_dto_1.stageRequiresApplicationDate)(stage) && !date) {
        throw new app_error_1.AppError("Set dateApplied before using this stage", 400, undefined, "APPLICATION_DATE_REQUIRED");
    }
};
const requireCompany = async (tx, companyId, userId) => {
    const company = await tx.company.findFirst({
        where: (0, soft_delete_1.withActiveRecordFilter)({ id: companyId, userId }), select: { id: true },
    });
    if (!company)
        throw new app_error_1.AppError("Company not found", 404, undefined, "APPLICATION_COMPANY_NOT_FOUND");
};
const requireRecruiter = async (tx, recruiter, companyId, userId) => {
    if (!recruiter)
        return;
    const contact = await tx.contact.findFirst({
        where: (0, soft_delete_1.withActiveRecordFilter)({ id: recruiter, companyId, userId }), select: { id: true },
    });
    if (!contact)
        throw new app_error_1.AppError("Recruiter contact not found for this company", 404, undefined, "APPLICATION_RECRUITER_NOT_FOUND");
};
// Every mutation of an existing application takes the same row lock. This serializes
// stage changes, detail changes, and soft-delete before reading the current state.
const withLockedApplication = (id, userId, work) => prisma_1.prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw `
    SELECT "id" FROM "Application"
    WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL
    FOR UPDATE
  `;
    if (!rows.length)
        throw notFound();
    const current = await tx.application.findUniqueOrThrow({ where: { id }, select: applications_types_1.applicationSelect });
    return work(tx, current);
}, transactionOptions);
const createApplication = (input, userId) => prisma_1.prisma.$transaction(async (tx) => {
    await requireCompany(tx, input.companyId, userId);
    await requireRecruiter(tx, input.recruiter, input.companyId, userId);
    requireApplicationDate(input.stage, input.dateApplied);
    const application = await tx.application.create({
        data: { ...(0, omit_undefined_1.omitUndefined)(input), userId }, select: applications_types_1.applicationSelect,
    });
    await tx.applicationStageHistory.create({
        data: { applicationId: application.id, fromStage: null, toStage: application.stage, changedById: userId },
    });
    return application;
}, transactionOptions);
exports.createApplication = createApplication;
const getApplication = async (id, userId) => {
    const application = await prisma_1.prisma.application.findFirst({
        where: (0, soft_delete_1.withActiveRecordFilter)({ id, userId }), select: applications_types_1.applicationSelect,
    });
    if (!application)
        throw notFound();
    return application;
};
exports.getApplication = getApplication;
const updateApplication = (id, input, userId) => withLockedApplication(id, userId, async (tx, current) => {
    const companyId = input.companyId ?? current.companyId;
    if (input.companyId !== undefined)
        await requireCompany(tx, companyId, userId);
    if (input.companyId !== undefined || input.recruiter !== undefined) {
        await requireRecruiter(tx, input.recruiter === undefined ? current.recruiter : input.recruiter, companyId, userId);
    }
    requireApplicationDate(current.stage, input.dateApplied === undefined ? current.dateApplied : input.dateApplied);
    return tx.application.update({ where: { id }, data: (0, omit_undefined_1.omitUndefined)(input), select: applications_types_1.applicationSelect });
});
exports.updateApplication = updateApplication;
const deleteApplication = async (id, userId) => {
    await withLockedApplication(id, userId, async (tx) => {
        await tx.application.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true } });
    });
};
exports.deleteApplication = deleteApplication;
const listApplications = async (query, userId) => {
    const { page, limit } = (0, pagination_1.parsePaginationQuery)({ page: query.page?.toString(), limit: query.limit?.toString() });
    const where = (0, soft_delete_1.withActiveRecordFilter)({ userId });
    if (query.companyId)
        where.companyId = query.companyId;
    if (query.stage)
        where.stage = query.stage;
    if (query.dateAppliedFrom || query.dateAppliedTo) {
        where.dateApplied = (0, omit_undefined_1.omitUndefined)({ gte: query.dateAppliedFrom, lte: query.dateAppliedTo });
    }
    if (query.search) {
        where.OR = [
            { position: { contains: query.search, mode: "insensitive" } },
            { notes: { contains: query.search, mode: "insensitive" } },
        ];
    }
    const orderBy = [
        query.sortBy === "dateApplied"
            ? { dateApplied: { sort: query.order, nulls: "last" } }
            : { [query.sortBy]: query.order },
        { id: "asc" },
    ];
    const [total, data] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.application.count({ where }),
        prisma_1.prisma.application.findMany({ where, select: applications_types_1.applicationSelect, orderBy, skip: (page - 1) * limit, take: limit }),
    ], { isolationLevel: client_1.Prisma.TransactionIsolationLevel.RepeatableRead });
    return { data, meta: (0, pagination_1.toPaginationMeta)(total, page, limit) };
};
exports.listApplications = listApplications;
const transitionApplicationStage = (id, input, userId) => withLockedApplication(id, userId, async (tx, current) => {
    // Any distinct valid stage is allowed, including skips, backward moves, and reopening.
    if (current.stage === input.stage)
        return current;
    requireApplicationDate(input.stage, current.dateApplied);
    const previous = await tx.applicationStageHistory.findFirst({
        where: { applicationId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { createdAt: true },
    });
    // Millisecond timestamps can tie during rapid transitions. Preserve chain order,
    // even when two transactions finish in the same millisecond or clocks differ.
    const createdAt = new Date(Math.max(Date.now(), (previous?.createdAt.getTime() ?? 0) + 1));
    const application = await tx.application.update({
        where: { id }, data: { stage: input.stage }, select: applications_types_1.applicationSelect,
    });
    await tx.applicationStageHistory.create({
        data: { applicationId: id, fromStage: current.stage, toStage: input.stage, changedById: userId, createdAt },
    });
    return application;
});
exports.transitionApplicationStage = transitionApplicationStage;
const listApplicationStageHistory = async (id, query, userId) => {
    const { page, limit } = (0, pagination_1.parsePaginationQuery)({ page: query.page?.toString(), limit: query.limit?.toString() });
    return prisma_1.prisma.$transaction(async (tx) => {
        const application = await tx.application.findFirst({
            where: (0, soft_delete_1.withActiveRecordFilter)({ id, userId }), select: { id: true },
        });
        if (!application)
            throw notFound();
        const where = { applicationId: id };
        const total = await tx.applicationStageHistory.count({ where });
        const data = await tx.applicationStageHistory.findMany({
            where, select: applications_types_1.stageHistorySelect, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            skip: (page - 1) * limit, take: limit,
        });
        return { data, meta: (0, pagination_1.toPaginationMeta)(total, page, limit) };
    }, { ...transactionOptions, isolationLevel: client_1.Prisma.TransactionIsolationLevel.RepeatableRead });
};
exports.listApplicationStageHistory = listApplicationStageHistory;
//# sourceMappingURL=applications.service.js.map