import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../shared/errors/app-error";
import { omitUndefined } from "../../../shared/utils/omit-undefined";
import { parsePaginationQuery, toPaginationMeta } from "../../../shared/utils/pagination";
import { withActiveRecordFilter } from "../../../shared/utils/soft-delete";
import {
  stageRequiresApplicationDate,
  type ApplicationHistoryQuery,
  type ApplicationListQuery,
  type ApplicationStageUpdate,
  type CreateApplicationInput,
  type UpdateApplicationInput,
} from "../dto/applications.dto";
import { applicationSelect, stageHistorySelect, type Application } from "../types/applications.types";

const notFound = () => new AppError("Application not found", 404, undefined, "APPLICATION_NOT_FOUND");
const transactionOptions = { maxWait: 10000, timeout: 15000 };

const requireApplicationDate = (stage: string, date: Date | null | undefined) => {
  if (stageRequiresApplicationDate(stage) && !date) {
    throw new AppError("Set dateApplied before using this stage", 400, undefined, "APPLICATION_DATE_REQUIRED");
  }
};

const requireCompany = async (tx: Prisma.TransactionClient, companyId: string, userId: string) => {
  const company = await tx.company.findFirst({
    where: withActiveRecordFilter({ id: companyId, userId }), select: { id: true },
  });
  if (!company) throw new AppError("Company not found", 404, undefined, "APPLICATION_COMPANY_NOT_FOUND");
};

const requireRecruiter = async (
  tx: Prisma.TransactionClient, recruiter: string | null | undefined, companyId: string, userId: string,
) => {
  if (!recruiter) return;
  const contact = await tx.contact.findFirst({
    where: withActiveRecordFilter({ id: recruiter, companyId, userId }), select: { id: true },
  });
  if (!contact) throw new AppError("Recruiter contact not found for this company", 404, undefined, "APPLICATION_RECRUITER_NOT_FOUND");
};

// Every mutation of an existing application takes the same row lock. This serializes
// stage changes, detail changes, and soft-delete before reading the current state.
const withLockedApplication = <T>(
  id: string, userId: string, work: (tx: Prisma.TransactionClient, current: Application) => Promise<T>,
): Promise<T> => prisma.$transaction(async (tx) => {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Application"
    WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL
    FOR UPDATE
  `;
  if (!rows.length) throw notFound();
  const current = await tx.application.findUniqueOrThrow({ where: { id }, select: applicationSelect });
  return work(tx, current);
}, transactionOptions);

export const createApplication = (input: CreateApplicationInput, userId: string) =>
  prisma.$transaction(async (tx) => {
    await requireCompany(tx, input.companyId, userId);
    await requireRecruiter(tx, input.recruiter, input.companyId, userId);
    requireApplicationDate(input.stage, input.dateApplied);
    const application = await tx.application.create({
      data: { ...omitUndefined(input), userId }, select: applicationSelect,
    });
    await tx.applicationStageHistory.create({
      data: { applicationId: application.id, fromStage: null, toStage: application.stage, changedById: userId },
    });
    return application;
  }, transactionOptions);

export const getApplication = async (id: string, userId: string) => {
  const application = await prisma.application.findFirst({
    where: withActiveRecordFilter({ id, userId }), select: applicationSelect,
  });
  if (!application) throw notFound();
  return application;
};

export const updateApplication = (id: string, input: UpdateApplicationInput, userId: string) =>
  withLockedApplication(id, userId, async (tx, current) => {
    const companyId = input.companyId ?? current.companyId;
    if (input.companyId !== undefined) await requireCompany(tx, companyId, userId);
    if (input.companyId !== undefined || input.recruiter !== undefined) {
      await requireRecruiter(tx, input.recruiter === undefined ? current.recruiter : input.recruiter, companyId, userId);
    }
    requireApplicationDate(current.stage, input.dateApplied === undefined ? current.dateApplied : input.dateApplied);
    return tx.application.update({ where: { id }, data: omitUndefined(input), select: applicationSelect });
  });

export const deleteApplication = async (id: string, userId: string): Promise<void> => {
  await withLockedApplication(id, userId, async (tx) => {
    await tx.application.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true } });
  });
};

export const listApplications = async (query: ApplicationListQuery, userId: string) => {
  const { page, limit } = parsePaginationQuery({ page: query.page?.toString(), limit: query.limit?.toString() });
  const where: Prisma.ApplicationWhereInput = withActiveRecordFilter({ userId });
  if (query.companyId) where.companyId = query.companyId;
  if (query.stage) where.stage = query.stage;
  if (query.dateAppliedFrom || query.dateAppliedTo) {
    where.dateApplied = omitUndefined({ gte: query.dateAppliedFrom, lte: query.dateAppliedTo });
  }
  if (query.search) {
    where.OR = [
      { position: { contains: query.search, mode: "insensitive" } },
      { notes: { contains: query.search, mode: "insensitive" } },
    ];
  }
  const orderBy: Prisma.ApplicationOrderByWithRelationInput[] = [
    query.sortBy === "dateApplied"
      ? { dateApplied: { sort: query.order, nulls: "last" } }
      : { [query.sortBy]: query.order },
    { id: "asc" },
  ];
  const [total, data] = await prisma.$transaction([
    prisma.application.count({ where }),
    prisma.application.findMany({ where, select: applicationSelect, orderBy, skip: (page - 1) * limit, take: limit }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  return { data, meta: toPaginationMeta(total, page, limit) };
};

export const transitionApplicationStage = (id: string, input: ApplicationStageUpdate, userId: string) =>
  withLockedApplication(id, userId, async (tx, current) => {
    // Any distinct valid stage is allowed, including skips, backward moves, and reopening.
    if (current.stage === input.stage) return current;
    requireApplicationDate(input.stage, current.dateApplied);
    const previous = await tx.applicationStageHistory.findFirst({
      where: { applicationId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { createdAt: true },
    });
    // Millisecond timestamps can tie during rapid transitions. Preserve chain order,
    // even when two transactions finish in the same millisecond or clocks differ.
    const createdAt = new Date(Math.max(Date.now(), (previous?.createdAt.getTime() ?? 0) + 1));
    const application = await tx.application.update({
      where: { id }, data: { stage: input.stage }, select: applicationSelect,
    });
    await tx.applicationStageHistory.create({
      data: { applicationId: id, fromStage: current.stage, toStage: input.stage, changedById: userId, createdAt },
    });
    return application;
  });

export const listApplicationStageHistory = async (id: string, query: ApplicationHistoryQuery, userId: string) => {
  const { page, limit } = parsePaginationQuery({ page: query.page?.toString(), limit: query.limit?.toString() });
  return prisma.$transaction(async (tx) => {
    const application = await tx.application.findFirst({
      where: withActiveRecordFilter({ id, userId }), select: { id: true },
    });
    if (!application) throw notFound();
    const where = { applicationId: id };
    const total = await tx.applicationStageHistory.count({ where });
    const data = await tx.applicationStageHistory.findMany({
      where, select: stageHistorySelect, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: (page - 1) * limit, take: limit,
    });
    return { data, meta: toPaginationMeta(total, page, limit) };
  }, { ...transactionOptions, isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
};
