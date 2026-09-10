import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../../shared/errors/app-error";
import { calendarSourceTypes, type CalendarSourceType } from "../dto/calendar.dto";
import type { CalendarEvent, StoredCalendarEvent } from "../types/calendar.types";

export const sourceColumns = {
  COMPANY: "companyId", CONTACT: "contactId", APPLICATION: "applicationId", TASK: "taskId", PROJECT: "projectId",
} as const;
const sourceTables = {
  COMPANY: Prisma.sql`"Company"`, CONTACT: Prisma.sql`"Contact"`, APPLICATION: Prisma.sql`"Application"`,
  TASK: Prisma.sql`"Task"`, PROJECT: Prisma.sql`"Project"`,
};
export const sourceFields = (type: CalendarSourceType | null | undefined, id: string | null | undefined) => {
  const fields: Record<typeof sourceColumns[CalendarSourceType], string | null> = {
    companyId: null, contactId: null, applicationId: null, taskId: null, projectId: null,
  };
  if (type && id) fields[sourceColumns[type]] = id;
  return fields;
};
export const requireCalendarSource = async (tx: Prisma.TransactionClient, type: CalendarSourceType, id: string, userId: string) => {
  // Static identifiers and bound values; SHARE waits for concurrent soft deletion.
  const rows = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT "id" FROM ${sourceTables[type]}
    WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL FOR SHARE
  `);
  if (!rows.length) throw new AppError("Calendar source not found", 404, undefined, "CALENDAR_SOURCE_NOT_FOUND");
};
const availableSources = (tx: Prisma.TransactionClient, type: CalendarSourceType, ids: string[], userId: string) => {
  const query = { where: { id: { in: ids }, userId, deletedAt: null }, select: { id: true } } as const;
  switch (type) {
    case "COMPANY": return tx.company.findMany(query);
    case "CONTACT": return tx.contact.findMany(query);
    case "APPLICATION": return tx.application.findMany(query);
    case "TASK": return tx.task.findMany(query);
    case "PROJECT": return tx.project.findMany(query);
  }
};
export const serializeCalendarEvents = async (tx: Prisma.TransactionClient, rows: StoredCalendarEvent[], userId: string): Promise<CalendarEvent[]> => {
  const sources = rows.map(row => {
    const type = calendarSourceTypes.find(type => row[sourceColumns[type]] !== null);
    return type ? { type, id: row[sourceColumns[type]]! } : null;
  });
  const available = new Map<CalendarSourceType, Set<string>>();
  await Promise.all(calendarSourceTypes.map(async type => {
    const ids = [...new Set(sources.filter(source => source?.type === type).map(source => source!.id))];
    if (ids.length) available.set(type, new Set((await availableSources(tx, type, ids, userId)).map(row => row.id)));
  }));
  return rows.map((row, index) => {
    const source = sources[index];
    return {
      id: row.id, userId: row.userId, title: row.title, type: row.type,
      startAt: row.startAt, endAt: row.endAt, timezone: row.timezone, reminders: row.reminders,
      sourceEntityType: source?.type ?? null, sourceEntityId: source?.id ?? null,
      sourceAvailable: source ? available.get(source.type)?.has(source.id) ?? false : null,
      createdAt: row.createdAt, updatedAt: row.updatedAt, deletedAt: row.deletedAt,
    };
  });
};
