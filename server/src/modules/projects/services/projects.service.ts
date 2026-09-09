import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../shared/errors/app-error";
import { omitUndefined } from "../../../shared/utils/omit-undefined";
import { parsePaginationQuery, toPaginationMeta } from "../../../shared/utils/pagination";
import { withActiveRecordFilter } from "../../../shared/utils/soft-delete";
import {
  projectStateSchema, type CreateProjectInput, type UpdateProjectInput,
  type ProjectProgressInput, type ProjectCommentInput, type ProjectListQuery, type ProjectActivityQuery,
} from "../dto/projects.dto";
import { projectSelect, projectActivitySelect, type Project } from "../types/projects.types";

const notFound = () => new AppError("Project not found", 404, undefined, "PROJECT_NOT_FOUND");
const transactionOptions = { maxWait: 10000, timeout: 15000 };
const pagination = (query: ProjectActivityQuery) => parsePaginationQuery({
  page: query.page?.toString(), limit: query.limit?.toString(),
});

// All mutations share this lock, so edits/deletion cannot interleave with progress snapshots.
const withLockedProject = <T>(
  id: string, userId: string, work: (tx: Prisma.TransactionClient, current: Project) => Promise<T>,
): Promise<T> => prisma.$transaction(async (tx) => {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Project"
    WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL
    FOR UPDATE
  `;
  if (!rows.length) throw notFound();
  const current = await tx.project.findUniqueOrThrow({ where: { id }, select: projectSelect });
  return work(tx, current);
}, transactionOptions);

// Called while holding the project lock. This orders rapid writes even within one millisecond.
const nextActivityDate = async (tx: Prisma.TransactionClient, projectId: string) => {
  const previous = await tx.projectActivity.findFirst({
    where: { projectId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { createdAt: true },
  });
  return new Date(Math.max(Date.now(), (previous?.createdAt.getTime() ?? 0) + 1));
};

export const createProject = (input: CreateProjectInput, userId: string) =>
  prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: { ...omitUndefined(input), userId }, select: projectSelect,
    });
    await tx.projectActivity.create({ data: {
      projectId: project.id, createdById: userId, type: "CREATED",
      toStatus: project.status, toProgress: project.progress, createdAt: project.createdAt,
    } });
    return project;
  }, transactionOptions);

export const getProject = async (id: string, userId: string) => {
  const project = await prisma.project.findFirst({
    where: withActiveRecordFilter({ id, userId }), select: projectSelect,
  });
  if (!project) throw notFound();
  return project;
};

export const updateProject = (id: string, input: UpdateProjectInput, userId: string) =>
  withLockedProject(id, userId, (tx) => tx.project.update({
    where: { id }, data: omitUndefined(input), select: projectSelect,
  }));

export const deleteProject = async (id: string, userId: string): Promise<void> => {
  await withLockedProject(id, userId, (tx) => tx.project.update({
    where: { id }, data: { deletedAt: new Date() }, select: { id: true },
  }));
};

export const listProjects = async (query: ProjectListQuery, userId: string) => {
  const { page, limit } = pagination(query);
  const where: Prisma.ProjectWhereInput = withActiveRecordFilter({ userId });
  if (query.status) where.status = query.status;
  if (query.stack) where.stack = { has: query.stack };
  if (query.search) where.OR = [
    { name: { contains: query.search, mode: "insensitive" } },
    { lessonsLearned: { contains: query.search, mode: "insensitive" } },
  ];
  const orderBy: Prisma.ProjectOrderByWithRelationInput[] = [{ [query.sortBy]: query.order }, { id: "asc" }];
  const [total, data] = await prisma.$transaction([
    prisma.project.count({ where }),
    prisma.project.findMany({ where, select: projectSelect, orderBy, skip: (page - 1) * limit, take: limit }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  return { data, meta: toPaginationMeta(total, page, limit) };
};

export const updateProjectProgress = (id: string, input: ProjectProgressInput, userId: string) =>
  withLockedProject(id, userId, async (tx, current) => {
    // Validate merged values, not just the fields present in this partial request.
    const state = projectStateSchema.parse({
      status: input.status ?? current.status, progress: input.progress ?? current.progress,
    });
    if (state.status === current.status && state.progress === current.progress) return current;
    const createdAt = await nextActivityDate(tx, id);
    const project = await tx.project.update({ where: { id }, data: state, select: projectSelect });
    await tx.projectActivity.create({ data: {
      projectId: id, createdById: userId, type: "PROGRESS_UPDATE",
      fromStatus: current.status, toStatus: state.status,
      fromProgress: current.progress, toProgress: state.progress,
      content: input.content ?? null, createdAt,
    } });
    return project;
  });

export const createProjectComment = (id: string, input: ProjectCommentInput, userId: string) =>
  withLockedProject(id, userId, async (tx) => tx.projectActivity.create({
    data: {
      projectId: id, createdById: userId, type: "COMMENT", content: input.content,
      createdAt: await nextActivityDate(tx, id),
    },
    select: projectActivitySelect,
  }));

export const listProjectActivities = async (id: string, query: ProjectActivityQuery, userId: string) => {
  const { page, limit } = pagination(query);
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({
      where: withActiveRecordFilter({ id, userId }), select: { id: true },
    });
    if (!project) throw notFound();
    const where = { projectId: id };
    const total = await tx.projectActivity.count({ where });
    const data = await tx.projectActivity.findMany({
      where, select: projectActivitySelect, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: (page - 1) * limit, take: limit,
    });
    return { data, meta: toPaginationMeta(total, page, limit) };
  }, { ...transactionOptions, isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
};
