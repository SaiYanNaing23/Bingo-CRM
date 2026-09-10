import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../shared/errors/app-error";
import { omitUndefined } from "../../../shared/utils/omit-undefined";
import { parsePaginationQuery, toPaginationMeta } from "../../../shared/utils/pagination";
import type { CreateCalendarEventInput, UpdateCalendarEventInput, CalendarEventListQuery, CalendarRangeQuery, CalendarReminderQuery } from "../dto/calendar.dto";
import { calendarEventSelect, type CalendarReminder, type StoredCalendarEvent } from "../types/calendar.types";
import { sourceColumns, sourceFields, requireCalendarSource, serializeCalendarEvents } from "./calendar.sources";
import { calendarWindow, requireCalendarTimezone, validateCalendarSchedule } from "./calendar.schedule";

const transactionOptions = { maxWait: 10000, timeout: 15000 };
const readOptions = { ...transactionOptions, isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead };
const notFound = () => new AppError("Calendar event not found", 404, undefined, "CALENDAR_EVENT_NOT_FOUND");
const pagination = (query: { page?: number | undefined; limit?: number | undefined }) =>
  parsePaginationQuery({ page: query.page?.toString(), limit: query.limit?.toString() });
const withLockedEvent = <T>(id: string, userId: string, work: (tx: Prisma.TransactionClient, event: StoredCalendarEvent) => Promise<T>) =>
  prisma.$transaction(async tx => {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "CalendarEvent" WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL FOR UPDATE
    `;
    if (!rows.length) throw notFound();
    return work(tx, await tx.calendarEvent.findUniqueOrThrow({ where: { id }, select: calendarEventSelect }));
  }, transactionOptions);

export const createCalendarEvent = (input: CreateCalendarEventInput, userId: string) => prisma.$transaction(async tx => {
  const { sourceEntityType, sourceEntityId, ...fields } = input;
  validateCalendarSchedule(fields);
  await requireCalendarTimezone(tx, fields.timezone);
  if (sourceEntityType && sourceEntityId) await requireCalendarSource(tx, sourceEntityType, sourceEntityId, userId);
  const row = await tx.calendarEvent.create({ data: { ...fields, userId, ...sourceFields(sourceEntityType, sourceEntityId) }, select: calendarEventSelect });
  return (await serializeCalendarEvents(tx, [row], userId))[0]!;
}, transactionOptions);

export const getCalendarEvent = (id: string, userId: string) => prisma.$transaction(async tx => {
  const row = await tx.calendarEvent.findFirst({ where: { id, userId, deletedAt: null }, select: calendarEventSelect });
  if (!row) throw notFound();
  return (await serializeCalendarEvents(tx, [row], userId))[0]!;
}, readOptions);

export const updateCalendarEvent = (id: string, input: UpdateCalendarEventInput, userId: string) => withLockedEvent(id, userId, async (tx, current) => {
  const { sourceEntityType, sourceEntityId, ...fields } = input;
  validateCalendarSchedule({ ...current, ...omitUndefined(fields) });
  if (fields.timezone !== undefined) await requireCalendarTimezone(tx, fields.timezone);
  if (sourceEntityType && sourceEntityId) await requireCalendarSource(tx, sourceEntityType, sourceEntityId, userId);
  const row = await tx.calendarEvent.update({
    where: { id }, data: { ...omitUndefined(fields), ...(sourceEntityType === undefined ? {} : sourceFields(sourceEntityType, sourceEntityId)) },
    select: calendarEventSelect,
  });
  return (await serializeCalendarEvents(tx, [row], userId))[0]!;
});

export const deleteCalendarEvent = async (id: string, userId: string): Promise<void> => {
  await withLockedEvent(id, userId, tx => tx.calendarEvent.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true } }));
};

const eventWhere = (query: Pick<CalendarEventListQuery, "type" | "search" | "sourceEntityType" | "sourceEntityId" | "from" | "to">, userId: string): Prisma.CalendarEventWhereInput => {
  const where: Prisma.CalendarEventWhereInput = { userId, deletedAt: null };
  if (query.type) where.type = query.type;
  if (query.search) where.title = { contains: query.search, mode: "insensitive" };
  if (query.sourceEntityType && query.sourceEntityId) where[sourceColumns[query.sourceEntityType]] = query.sourceEntityId;
  if (query.from && query.to) where.OR = [
    { endAt: null, startAt: { gte: query.from, lt: query.to } },
    { endAt: { gt: query.from }, startAt: { lt: query.to } },
  ];
  return where;
};
const listInTransaction = async (tx: Prisma.TransactionClient, query: CalendarEventListQuery, userId: string) => {
  const { page, limit } = pagination(query);
  const where = eventWhere(query, userId);
  const total = await tx.calendarEvent.count({ where });
  const rows = await tx.calendarEvent.findMany({ where, select: calendarEventSelect,
    orderBy: [{ [query.sortBy]: query.order }, { id: "asc" }], skip: (page - 1) * limit, take: limit });
  return { data: await serializeCalendarEvents(tx, rows, userId), meta: toPaginationMeta(total, page, limit) };
};
export const listCalendarEvents = (query: CalendarEventListQuery, userId: string) =>
  prisma.$transaction(tx => listInTransaction(tx, query, userId), readOptions);

export const getCalendarRange = (query: CalendarRangeQuery, userId: string) => prisma.$transaction(async tx => {
  const range = await calendarWindow(tx, query);
  const result = await listInTransaction(tx, { ...query, ...range, sortBy: "startAt", order: "asc" }, userId);
  return { view: query.view ?? "custom", timezone: query.timezone, range, events: result.data, meta: result.meta };
}, readOptions);

export const listCalendarReminders = (query: CalendarReminderQuery, userId: string) => prisma.$transaction(async tx => {
  const { page, limit } = pagination(query);
  // Filter by startAt too so the owner/start index bounds candidate events. The
  // database performs expansion, ordering, count and pagination before transport.
  const schedule = Prisma.sql`
    SELECT e."id" AS "eventId", e."title", e."type", e."startAt", e."timezone", r."minutesBefore",
      e."startAt" - r."minutesBefore" * interval '1 minute' AS "remindAt"
    FROM "CalendarEvent" e CROSS JOIN LATERAL unnest(e."reminders") AS r("minutesBefore")
    WHERE e."userId" = ${userId} AND e."deletedAt" IS NULL
      AND e."startAt" >= ${query.from.toISOString()}::timestamptz
      AND e."startAt" < ${query.to.toISOString()}::timestamptz + interval '168 hours'
  `;
  const window = Prisma.sql`"remindAt" >= ${query.from.toISOString()}::timestamptz AND "remindAt" < ${query.to.toISOString()}::timestamptz`;
  const [count] = await tx.$queryRaw<{ total: bigint }[]>(Prisma.sql`WITH schedule AS (${schedule}) SELECT count(*) AS total FROM schedule WHERE ${window}`);
  const rows = await tx.$queryRaw<Omit<CalendarReminder, "id">[]>(Prisma.sql`
    WITH schedule AS (${schedule}) SELECT * FROM schedule WHERE ${window}
    ORDER BY "remindAt" ASC, "eventId" ASC, "minutesBefore" ASC LIMIT ${limit} OFFSET ${(page - 1) * limit}
  `);
  return { data: rows.map(row => ({ id: `${row.eventId}:${row.minutesBefore}`, ...row })), meta: toPaginationMeta(Number(count!.total), page, limit) };
}, readOptions);
