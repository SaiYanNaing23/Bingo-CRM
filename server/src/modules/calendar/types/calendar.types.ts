import type { Prisma } from "../../../generated/prisma/client";
import type { CalendarSourceType } from "../dto/calendar.dto";

export const calendarEventSelect = {
  id: true, userId: true, title: true, type: true, startAt: true, endAt: true, timezone: true, reminders: true,
  companyId: true, contactId: true, applicationId: true, taskId: true, projectId: true,
  createdAt: true, updatedAt: true, deletedAt: true,
} as const satisfies Prisma.CalendarEventSelect;
export type StoredCalendarEvent = Prisma.CalendarEventGetPayload<{ select: typeof calendarEventSelect }>;
export type CalendarEvent = Omit<StoredCalendarEvent, "companyId" | "contactId" | "applicationId" | "taskId" | "projectId"> & {
  sourceEntityType: CalendarSourceType | null; sourceEntityId: string | null; sourceAvailable: boolean | null;
};
export type CalendarReminder = {
  id: string; eventId: string; title: string; type: CalendarEvent["type"]; startAt: Date;
  timezone: string; minutesBefore: number; remindAt: Date;
};
