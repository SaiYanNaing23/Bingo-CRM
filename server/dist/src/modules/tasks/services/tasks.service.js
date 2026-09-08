"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayTasks = exports.listTasks = exports.completeTask = exports.deleteTask = exports.updateTask = exports.getTask = exports.createTask = void 0;
const client_1 = require("../../../generated/prisma/client");
const prisma_1 = require("../../../lib/prisma");
const app_error_1 = require("../../../shared/errors/app-error");
const omit_undefined_1 = require("../../../shared/utils/omit-undefined");
const pagination_1 = require("../../../shared/utils/pagination");
const soft_delete_1 = require("../../../shared/utils/soft-delete");
const tasks_types_1 = require("../types/tasks.types");
const tasks_schedule_1 = require("./tasks.schedule");
const notFound = () => new app_error_1.AppError("Task not found", 404, undefined, "TASK_NOT_FOUND");
const transactionOptions = { maxWait: 10000, timeout: 15000 };
const openStatuses = ["TODO", "IN_PROGRESS"];
const requireRepeatingDueDate = (pattern, dueDate) => {
    if (pattern !== "NONE" && !dueDate) {
        throw new app_error_1.AppError("A repeating task requires dueDate", 400, undefined, "TASK_DUE_DATE_REQUIRED");
    }
};
const withLockedTask = (id, userId, work) => prisma_1.prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw `
    SELECT "id" FROM "Task"
    WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL
    FOR UPDATE
  `;
    if (!rows.length)
        throw notFound();
    const task = await tx.task.findUniqueOrThrow({ where: { id }, select: tasks_types_1.taskSelect });
    return work(tx, task);
}, transactionOptions);
const createTask = (input, userId) => prisma_1.prisma.$transaction(async (tx) => {
    requireRepeatingDueDate(input.repeatPattern, input.dueDate);
    await (0, tasks_schedule_1.requireTaskTimezone)(tx, input.timezone);
    return tx.task.create({ data: { ...(0, omit_undefined_1.omitUndefined)(input), userId }, select: tasks_types_1.taskSelect });
}, transactionOptions);
exports.createTask = createTask;
const getTask = async (id, userId) => {
    const task = await prisma_1.prisma.task.findFirst({ where: (0, soft_delete_1.withActiveRecordFilter)({ id, userId }), select: tasks_types_1.taskSelect });
    if (!task)
        throw notFound();
    return task;
};
exports.getTask = getTask;
const updateTask = (id, input, userId) => withLockedTask(id, userId, async (tx, current) => {
    if (current.status === "COMPLETED") {
        throw new app_error_1.AppError("Completed tasks cannot be edited or reopened", 409, undefined, "TASK_COMPLETED");
    }
    requireRepeatingDueDate(input.repeatPattern ?? current.repeatPattern, input.dueDate === undefined ? current.dueDate : input.dueDate);
    if (input.timezone !== undefined)
        await (0, tasks_schedule_1.requireTaskTimezone)(tx, input.timezone);
    return tx.task.update({ where: { id }, data: (0, omit_undefined_1.omitUndefined)(input), select: tasks_types_1.taskSelect });
});
exports.updateTask = updateTask;
const deleteTask = async (id, userId) => {
    await withLockedTask(id, userId, async (tx) => {
        await tx.task.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true } });
    });
};
exports.deleteTask = deleteTask;
const completeTask = (id, userId) => withLockedTask(id, userId, async (tx, current) => {
    if (current.status === "COMPLETED") {
        const nextTask = await tx.task.findFirst({
            where: (0, soft_delete_1.withActiveRecordFilter)({ recurrenceSourceId: id, userId }), select: tasks_types_1.taskSelect,
        });
        return { task: current, nextTask };
    }
    if (current.status === "CANCELLED") {
        throw new app_error_1.AppError("Reopen a cancelled task before completing it", 409, undefined, "TASK_CANCELLED");
    }
    const task = await tx.task.update({
        where: { id }, data: { status: "COMPLETED", completedAt: new Date() }, select: tasks_types_1.taskSelect,
    });
    let nextTask = null;
    if (current.repeatPattern !== "NONE") {
        requireRepeatingDueDate(current.repeatPattern, current.dueDate);
        const dueDate = await (0, tasks_schedule_1.nextTaskDueDate)(tx, current.dueDate, current.timezone, current.repeatPattern);
        nextTask = await tx.task.create({
            data: {
                userId, title: current.title, type: current.type, priority: current.priority,
                dueDate, timezone: current.timezone, repeatPattern: current.repeatPattern,
                status: "TODO", recurrenceSourceId: id,
            },
            select: tasks_types_1.taskSelect,
        });
    }
    return { task, nextTask };
});
exports.completeTask = completeTask;
const orderTasks = (sortBy, order) => [
    sortBy === "dueDate" ? { dueDate: { sort: order, nulls: "last" } } : { [sortBy]: order },
    ...(sortBy === "priority" ? [] : [{ priority: "desc" }]),
    { id: "asc" },
];
const listTasks = async (query, userId) => {
    const { page, limit } = (0, pagination_1.parsePaginationQuery)({ page: query.page?.toString(), limit: query.limit?.toString() });
    const where = (0, soft_delete_1.withActiveRecordFilter)({ userId });
    if (query.type)
        where.type = query.type;
    if (query.priority)
        where.priority = query.priority;
    if (query.status)
        where.status = query.status;
    if (query.repeatPattern)
        where.repeatPattern = query.repeatPattern;
    if (query.search)
        where.title = { contains: query.search, mode: "insensitive" };
    if (query.dueDateFrom || query.dueDateTo)
        where.dueDate = (0, omit_undefined_1.omitUndefined)({ gte: query.dueDateFrom, lte: query.dueDateTo });
    const [total, data] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.task.count({ where }),
        prisma_1.prisma.task.findMany({ where, select: tasks_types_1.taskSelect, orderBy: orderTasks(query.sortBy, query.order), skip: (page - 1) * limit, take: limit }),
    ], { isolationLevel: client_1.Prisma.TransactionIsolationLevel.RepeatableRead });
    return { data, meta: (0, pagination_1.toPaginationMeta)(total, page, limit) };
};
exports.listTasks = listTasks;
const getTodayTasks = async (query, userId, now = new Date()) => {
    const { page, limit } = (0, pagination_1.parsePaginationQuery)({ page: query.page?.toString(), limit: query.limit?.toString() });
    return prisma_1.prisma.$transaction(async (tx) => {
        await (0, tasks_schedule_1.requireTaskTimezone)(tx, query.timezone);
        const window = await (0, tasks_schedule_1.taskDayWindow)(tx, query.timezone, now);
        const owner = (0, soft_delete_1.withActiveRecordFilter)({ userId });
        const where = { ...owner, dueDate: { gte: window.start, lt: window.end } };
        const groups = await tx.task.groupBy({ by: ["status"], where, _count: { _all: true } });
        const counts = { TODO: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
        for (const group of groups)
            counts[group.status] = group._count._all;
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        const [tasks, overdue, unscheduled] = await Promise.all([
            tx.task.findMany({ where, select: tasks_types_1.taskSelect, orderBy: orderTasks("dueDate", "asc"), skip: (page - 1) * limit, take: limit }),
            tx.task.count({ where: { ...owner, status: { in: openStatuses }, dueDate: { lt: window.start } } }),
            tx.task.count({ where: { ...owner, status: { in: openStatuses }, dueDate: null } }),
        ]);
        return {
            date: window.date, timezone: query.timezone, range: { from: window.start, to: window.end },
            tasks, meta: (0, pagination_1.toPaginationMeta)(total, page, limit),
            summary: { dueToday: total, pendingToday: counts.TODO, inProgressToday: counts.IN_PROGRESS,
                completedToday: counts.COMPLETED, cancelledToday: counts.CANCELLED, overdue, unscheduled },
        };
    }, { ...transactionOptions, isolationLevel: client_1.Prisma.TransactionIsolationLevel.RepeatableRead });
};
exports.getTodayTasks = getTodayTasks;
//# sourceMappingURL=tasks.service.js.map