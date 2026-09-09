"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProjectActivities = exports.createProjectComment = exports.updateProjectProgress = exports.listProjects = exports.deleteProject = exports.updateProject = exports.getProject = exports.createProject = void 0;
const client_1 = require("../../../generated/prisma/client");
const prisma_1 = require("../../../lib/prisma");
const app_error_1 = require("../../../shared/errors/app-error");
const omit_undefined_1 = require("../../../shared/utils/omit-undefined");
const pagination_1 = require("../../../shared/utils/pagination");
const soft_delete_1 = require("../../../shared/utils/soft-delete");
const projects_dto_1 = require("../dto/projects.dto");
const projects_types_1 = require("../types/projects.types");
const notFound = () => new app_error_1.AppError("Project not found", 404, undefined, "PROJECT_NOT_FOUND");
const transactionOptions = { maxWait: 10000, timeout: 15000 };
const pagination = (query) => (0, pagination_1.parsePaginationQuery)({
    page: query.page?.toString(), limit: query.limit?.toString(),
});
// All mutations share this lock, so edits/deletion cannot interleave with progress snapshots.
const withLockedProject = (id, userId, work) => prisma_1.prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw `
    SELECT "id" FROM "Project"
    WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL
    FOR UPDATE
  `;
    if (!rows.length)
        throw notFound();
    const current = await tx.project.findUniqueOrThrow({ where: { id }, select: projects_types_1.projectSelect });
    return work(tx, current);
}, transactionOptions);
// Called while holding the project lock. This orders rapid writes even within one millisecond.
const nextActivityDate = async (tx, projectId) => {
    const previous = await tx.projectActivity.findFirst({
        where: { projectId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { createdAt: true },
    });
    return new Date(Math.max(Date.now(), (previous?.createdAt.getTime() ?? 0) + 1));
};
const createProject = (input, userId) => prisma_1.prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
        data: { ...(0, omit_undefined_1.omitUndefined)(input), userId }, select: projects_types_1.projectSelect,
    });
    await tx.projectActivity.create({ data: {
            projectId: project.id, createdById: userId, type: "CREATED",
            toStatus: project.status, toProgress: project.progress, createdAt: project.createdAt,
        } });
    return project;
}, transactionOptions);
exports.createProject = createProject;
const getProject = async (id, userId) => {
    const project = await prisma_1.prisma.project.findFirst({
        where: (0, soft_delete_1.withActiveRecordFilter)({ id, userId }), select: projects_types_1.projectSelect,
    });
    if (!project)
        throw notFound();
    return project;
};
exports.getProject = getProject;
const updateProject = (id, input, userId) => withLockedProject(id, userId, (tx) => tx.project.update({
    where: { id }, data: (0, omit_undefined_1.omitUndefined)(input), select: projects_types_1.projectSelect,
}));
exports.updateProject = updateProject;
const deleteProject = async (id, userId) => {
    await withLockedProject(id, userId, (tx) => tx.project.update({
        where: { id }, data: { deletedAt: new Date() }, select: { id: true },
    }));
};
exports.deleteProject = deleteProject;
const listProjects = async (query, userId) => {
    const { page, limit } = pagination(query);
    const where = (0, soft_delete_1.withActiveRecordFilter)({ userId });
    if (query.status)
        where.status = query.status;
    if (query.stack)
        where.stack = { has: query.stack };
    if (query.search)
        where.OR = [
            { name: { contains: query.search, mode: "insensitive" } },
            { lessonsLearned: { contains: query.search, mode: "insensitive" } },
        ];
    const orderBy = [{ [query.sortBy]: query.order }, { id: "asc" }];
    const [total, data] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.project.count({ where }),
        prisma_1.prisma.project.findMany({ where, select: projects_types_1.projectSelect, orderBy, skip: (page - 1) * limit, take: limit }),
    ], { isolationLevel: client_1.Prisma.TransactionIsolationLevel.RepeatableRead });
    return { data, meta: (0, pagination_1.toPaginationMeta)(total, page, limit) };
};
exports.listProjects = listProjects;
const updateProjectProgress = (id, input, userId) => withLockedProject(id, userId, async (tx, current) => {
    // Validate merged values, not just the fields present in this partial request.
    const state = projects_dto_1.projectStateSchema.parse({
        status: input.status ?? current.status, progress: input.progress ?? current.progress,
    });
    if (state.status === current.status && state.progress === current.progress)
        return current;
    const createdAt = await nextActivityDate(tx, id);
    const project = await tx.project.update({ where: { id }, data: state, select: projects_types_1.projectSelect });
    await tx.projectActivity.create({ data: {
            projectId: id, createdById: userId, type: "PROGRESS_UPDATE",
            fromStatus: current.status, toStatus: state.status,
            fromProgress: current.progress, toProgress: state.progress,
            content: input.content ?? null, createdAt,
        } });
    return project;
});
exports.updateProjectProgress = updateProjectProgress;
const createProjectComment = (id, input, userId) => withLockedProject(id, userId, async (tx) => tx.projectActivity.create({
    data: {
        projectId: id, createdById: userId, type: "COMMENT", content: input.content,
        createdAt: await nextActivityDate(tx, id),
    },
    select: projects_types_1.projectActivitySelect,
}));
exports.createProjectComment = createProjectComment;
const listProjectActivities = async (id, query, userId) => {
    const { page, limit } = pagination(query);
    return prisma_1.prisma.$transaction(async (tx) => {
        const project = await tx.project.findFirst({
            where: (0, soft_delete_1.withActiveRecordFilter)({ id, userId }), select: { id: true },
        });
        if (!project)
            throw notFound();
        const where = { projectId: id };
        const total = await tx.projectActivity.count({ where });
        const data = await tx.projectActivity.findMany({
            where, select: projects_types_1.projectActivitySelect, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            skip: (page - 1) * limit, take: limit,
        });
        return { data, meta: (0, pagination_1.toPaginationMeta)(total, page, limit) };
    }, { ...transactionOptions, isolationLevel: client_1.Prisma.TransactionIsolationLevel.RepeatableRead });
};
exports.listProjectActivities = listProjectActivities;
//# sourceMappingURL=projects.service.js.map