import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../shared/errors/app-error";
import { omitUndefined } from "../../../shared/utils/omit-undefined";
import { parsePaginationQuery, toPaginationMeta } from "../../../shared/utils/pagination";
import { withActiveRecordFilter } from "../../../shared/utils/soft-delete";
import type { CreateTaskInput, TaskListQuery, TodayTasksQuery, UpdateTaskInput } from "../dto/tasks.dto";
import { taskSelect, type Task } from "../types/tasks.types";
import { nextTaskDueDate, requireTaskTimezone, taskDayWindow } from "./tasks.schedule";

const notFound = () => new AppError("Task not found", 404, undefined, "TASK_NOT_FOUND");
const transactionOptions = { maxWait: 10000, timeout: 15000 };
const openStatuses: Task["status"][] = ["TODO", "IN_PROGRESS"];

const requireRepeatingDueDate = (pattern: Task["repeatPattern"], dueDate: Date | null | undefined) => {
  if (pattern !== "NONE" && !dueDate) {
    throw new AppError("A repeating task requires dueDate", 400, undefined, "TASK_DUE_DATE_REQUIRED");
  }
};

const withLockedTask = <T>(
  id: string, userId: string, work: (tx: Prisma.TransactionClient, task: Task) => Promise<T>,
): Promise<T> => prisma.$transaction(async (tx) => {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Task"
    WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL
    FOR UPDATE
  `;
  if (!rows.length) throw notFound();
  const task = await tx.task.findUniqueOrThrow({ where: { id }, select: taskSelect });
  return work(tx, task);
}, transactionOptions);

export const createTask = (input: CreateTaskInput, userId: string) => prisma.$transaction(async (tx) => {
  requireRepeatingDueDate(input.repeatPattern, input.dueDate);
  await requireTaskTimezone(tx, input.timezone);
  return tx.task.create({ data: { ...omitUndefined(input), userId }, select: taskSelect });
}, transactionOptions);

export const getTask = async (id: string, userId: string) => {
  const task = await prisma.task.findFirst({ where: withActiveRecordFilter({ id, userId }), select: taskSelect });
  if (!task) throw notFound();
  return task;
};

export const updateTask = (id: string, input: UpdateTaskInput, userId: string) =>
  withLockedTask(id, userId, async (tx, current) => {
    if (current.status === "COMPLETED") {
      throw new AppError("Completed tasks cannot be edited or reopened", 409, undefined, "TASK_COMPLETED");
    }
    requireRepeatingDueDate(input.repeatPattern ?? current.repeatPattern, input.dueDate === undefined ? current.dueDate : input.dueDate);
    if (input.timezone !== undefined) await requireTaskTimezone(tx, input.timezone);
    return tx.task.update({ where: { id }, data: omitUndefined(input), select: taskSelect });
  });

export const deleteTask = async (id: string, userId: string): Promise<void> => {
  await withLockedTask(id, userId, async (tx) => {
    await tx.task.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true } });
  });
};

export const completeTask = (id: string, userId: string) => withLockedTask(id, userId, async (tx, current) => {
  if (current.status === "COMPLETED") {
    const nextTask = await tx.task.findFirst({
      where: withActiveRecordFilter({ recurrenceSourceId: id, userId }), select: taskSelect,
    });
    return { task: current, nextTask };
  }
  if (current.status === "CANCELLED") {
    throw new AppError("Reopen a cancelled task before completing it", 409, undefined, "TASK_CANCELLED");
  }
  const task = await tx.task.update({
    where: { id }, data: { status: "COMPLETED", completedAt: new Date() }, select: taskSelect,
  });
  let nextTask: Task | null = null;
  if (current.repeatPattern !== "NONE") {
    requireRepeatingDueDate(current.repeatPattern, current.dueDate);
    const dueDate = await nextTaskDueDate(tx, current.dueDate!, current.timezone, current.repeatPattern);
    nextTask = await tx.task.create({
      data: {
        userId, title: current.title, type: current.type, priority: current.priority,
        dueDate, timezone: current.timezone, repeatPattern: current.repeatPattern,
        status: "TODO", recurrenceSourceId: id,
      },
      select: taskSelect,
    });
  }
  return { task, nextTask };
});

const orderTasks = (sortBy: TaskListQuery["sortBy"], order: TaskListQuery["order"]): Prisma.TaskOrderByWithRelationInput[] => [
  sortBy === "dueDate" ? { dueDate: { sort: order, nulls: "last" } } : { [sortBy]: order },
  ...(sortBy === "priority" ? [] : [{ priority: "desc" as const }]),
  { id: "asc" },
];

export const listTasks = async (query: TaskListQuery, userId: string) => {
  const { page, limit } = parsePaginationQuery({ page: query.page?.toString(), limit: query.limit?.toString() });
  const where: Prisma.TaskWhereInput = withActiveRecordFilter({ userId });
  if (query.type) where.type = query.type;
  if (query.priority) where.priority = query.priority;
  if (query.status) where.status = query.status;
  if (query.repeatPattern) where.repeatPattern = query.repeatPattern;
  if (query.search) where.title = { contains: query.search, mode: "insensitive" };
  if (query.dueDateFrom || query.dueDateTo) where.dueDate = omitUndefined({ gte: query.dueDateFrom, lte: query.dueDateTo });
  const [total, data] = await prisma.$transaction([
    prisma.task.count({ where }),
    prisma.task.findMany({ where, select: taskSelect, orderBy: orderTasks(query.sortBy, query.order), skip: (page - 1) * limit, take: limit }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  return { data, meta: toPaginationMeta(total, page, limit) };
};

export const getTodayTasks = async (query: TodayTasksQuery, userId: string, now = new Date()) => {
  const { page, limit } = parsePaginationQuery({ page: query.page?.toString(), limit: query.limit?.toString() });
  return prisma.$transaction(async (tx) => {
    await requireTaskTimezone(tx, query.timezone);
    const window = await taskDayWindow(tx, query.timezone, now);
    const owner = withActiveRecordFilter({ userId });
    const where: Prisma.TaskWhereInput = { ...owner, dueDate: { gte: window.start, lt: window.end } };
    const groups = await tx.task.groupBy({ by: ["status"], where, _count: { _all: true } });
    const counts: Record<Task["status"], number> = { TODO: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
    for (const group of groups) counts[group.status] = group._count._all;
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const [tasks, overdue, unscheduled] = await Promise.all([
      tx.task.findMany({ where, select: taskSelect, orderBy: orderTasks("dueDate", "asc"), skip: (page - 1) * limit, take: limit }),
      tx.task.count({ where: { ...owner, status: { in: openStatuses }, dueDate: { lt: window.start } } }),
      tx.task.count({ where: { ...owner, status: { in: openStatuses }, dueDate: null } }),
    ]);
    return {
      date: window.date, timezone: query.timezone, range: { from: window.start, to: window.end },
      tasks, meta: toPaginationMeta(total, page, limit),
      summary: { dueToday: total, pendingToday: counts.TODO, inProgressToday: counts.IN_PROGRESS,
        completedToday: counts.COMPLETED, cancelledToday: counts.CANCELLED, overdue, unscheduled },
    };
  }, { ...transactionOptions, isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
};
