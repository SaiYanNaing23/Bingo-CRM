"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCalendarReminders = exports.getCalendarRange = exports.listCalendarEvents = exports.deleteCalendarEvent = exports.updateCalendarEvent = exports.getCalendarEvent = exports.createCalendarEvent = void 0;
const client_1 = require("../../../generated/prisma/client");
const prisma_1 = require("../../../lib/prisma");
const app_error_1 = require("../../../shared/errors/app-error");
const omit_undefined_1 = require("../../../shared/utils/omit-undefined");
const pagination_1 = require("../../../shared/utils/pagination");
const calendar_types_1 = require("../types/calendar.types");
const calendar_sources_1 = require("./calendar.sources");
const calendar_schedule_1 = require("./calendar.schedule");
const transactionOptions = { maxWait: 10000, timeout: 15000 };
const readOptions = { ...transactionOptions, isolationLevel: client_1.Prisma.TransactionIsolationLevel.RepeatableRead };
const notFound = () => new app_error_1.AppError("Calendar event not found", 404, undefined, "CALENDAR_EVENT_NOT_FOUND");
const pagination = (query) => (0, pagination_1.parsePaginationQuery)({ page: query.page?.toString(), limit: query.limit?.toString() });
const withLockedEvent = (id, userId, work) => prisma_1.prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw `
      SELECT "id" FROM "CalendarEvent" WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL FOR UPDATE
    `;
    if (!rows.length)
        throw notFound();
    return work(tx, await tx.calendarEvent.findUniqueOrThrow({ where: { id }, select: calendar_types_1.calendarEventSelect }));
}, transactionOptions);
const createCalendarEvent = (input, userId) => prisma_1.prisma.$transaction(async (tx) => {
    const { sourceEntityType, sourceEntityId, ...fields } = input;
    (0, calendar_schedule_1.validateCalendarSchedule)(fields);
    await (0, calendar_schedule_1.requireCalendarTimezone)(tx, fields.timezone);
    if (sourceEntityType && sourceEntityId)
        await (0, calendar_sources_1.requireCalendarSource)(tx, sourceEntityType, sourceEntityId, userId);
    const row = await tx.calendarEvent.create({ data: { ...fields, userId, ...(0, calendar_sources_1.sourceFields)(sourceEntityType, sourceEntityId) }, select: calendar_types_1.calendarEventSelect });
    return (await (0, calendar_sources_1.serializeCalendarEvents)(tx, [row], userId))[0];
}, transactionOptions);
exports.createCalendarEvent = createCalendarEvent;
const getCalendarEvent = (id, userId) => prisma_1.prisma.$transaction(async (tx) => {
    const row = await tx.calendarEvent.findFirst({ where: { id, userId, deletedAt: null }, select: calendar_types_1.calendarEventSelect });
    if (!row)
        throw notFound();
    return (await (0, calendar_sources_1.serializeCalendarEvents)(tx, [row], userId))[0];
}, readOptions);
exports.getCalendarEvent = getCalendarEvent;
const updateCalendarEvent = (id, input, userId) => withLockedEvent(id, userId, async (tx, current) => {
    const { sourceEntityType, sourceEntityId, ...fields } = input;
    (0, calendar_schedule_1.validateCalendarSchedule)({ ...current, ...(0, omit_undefined_1.omitUndefined)(fields) });
    if (fields.timezone !== undefined)
        await (0, calendar_schedule_1.requireCalendarTimezone)(tx, fields.timezone);
    if (sourceEntityType && sourceEntityId)
        await (0, calendar_sources_1.requireCalendarSource)(tx, sourceEntityType, sourceEntityId, userId);
    const row = await tx.calendarEvent.update({
        where: { id }, data: { ...(0, omit_undefined_1.omitUndefined)(fields), ...(sourceEntityType === undefined ? {} : (0, calendar_sources_1.sourceFields)(sourceEntityType, sourceEntityId)) },
        select: calendar_types_1.calendarEventSelect,
    });
    return (await (0, calendar_sources_1.serializeCalendarEvents)(tx, [row], userId))[0];
});
exports.updateCalendarEvent = updateCalendarEvent;
const deleteCalendarEvent = async (id, userId) => {
    await withLockedEvent(id, userId, tx => tx.calendarEvent.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true } }));
};
exports.deleteCalendarEvent = deleteCalendarEvent;
const eventWhere = (query, userId) => {
    const where = { userId, deletedAt: null };
    if (query.type)
        where.type = query.type;
    if (query.search)
        where.title = { contains: query.search, mode: "insensitive" };
    if (query.sourceEntityType && query.sourceEntityId)
        where[calendar_sources_1.sourceColumns[query.sourceEntityType]] = query.sourceEntityId;
    if (query.from && query.to)
        where.OR = [
            { endAt: null, startAt: { gte: query.from, lt: query.to } },
            { endAt: { gt: query.from }, startAt: { lt: query.to } },
        ];
    return where;
};
const listInTransaction = async (tx, query, userId) => {
    const { page, limit } = pagination(query);
    const where = eventWhere(query, userId);
    const total = await tx.calendarEvent.count({ where });
    const rows = await tx.calendarEvent.findMany({ where, select: calendar_types_1.calendarEventSelect,
        orderBy: [{ [query.sortBy]: query.order }, { id: "asc" }], skip: (page - 1) * limit, take: limit });
    return { data: await (0, calendar_sources_1.serializeCalendarEvents)(tx, rows, userId), meta: (0, pagination_1.toPaginationMeta)(total, page, limit) };
};
const listCalendarEvents = (query, userId) => prisma_1.prisma.$transaction(tx => listInTransaction(tx, query, userId), readOptions);
exports.listCalendarEvents = listCalendarEvents;
const getCalendarRange = (query, userId) => prisma_1.prisma.$transaction(async (tx) => {
    const range = await (0, calendar_schedule_1.calendarWindow)(tx, query);
    const result = await listInTransaction(tx, { ...query, ...range, sortBy: "startAt", order: "asc" }, userId);
    return { view: query.view ?? "custom", timezone: query.timezone, range, events: result.data, meta: result.meta };
}, readOptions);
exports.getCalendarRange = getCalendarRange;
const listCalendarReminders = (query, userId) => prisma_1.prisma.$transaction(async (tx) => {
    const { page, limit } = pagination(query);
    // Filter by startAt too so the owner/start index bounds candidate events. The
    // database performs expansion, ordering, count and pagination before transport.
    const schedule = client_1.Prisma.sql `
    SELECT e."id" AS "eventId", e."title", e."type", e."startAt", e."timezone", r."minutesBefore",
      e."startAt" - r."minutesBefore" * interval '1 minute' AS "remindAt"
    FROM "CalendarEvent" e CROSS JOIN LATERAL unnest(e."reminders") AS r("minutesBefore")
    WHERE e."userId" = ${userId} AND e."deletedAt" IS NULL
      AND e."startAt" >= ${query.from.toISOString()}::timestamptz
      AND e."startAt" < ${query.to.toISOString()}::timestamptz + interval '168 hours'
  `;
    const window = client_1.Prisma.sql `"remindAt" >= ${query.from.toISOString()}::timestamptz AND "remindAt" < ${query.to.toISOString()}::timestamptz`;
    const [count] = await tx.$queryRaw(client_1.Prisma.sql `WITH schedule AS (${schedule}) SELECT count(*) AS total FROM schedule WHERE ${window}`);
    const rows = await tx.$queryRaw(client_1.Prisma.sql `
    WITH schedule AS (${schedule}) SELECT * FROM schedule WHERE ${window}
    ORDER BY "remindAt" ASC, "eventId" ASC, "minutesBefore" ASC LIMIT ${limit} OFFSET ${(page - 1) * limit}
  `);
    return { data: rows.map(row => ({ id: `${row.eventId}:${row.minutesBefore}`, ...row })), meta: (0, pagination_1.toPaginationMeta)(Number(count.total), page, limit) };
}, readOptions);
exports.listCalendarReminders = listCalendarReminders;
//# sourceMappingURL=calendar.service.js.map