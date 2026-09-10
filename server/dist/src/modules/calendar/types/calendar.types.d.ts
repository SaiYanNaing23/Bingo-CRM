import type { Prisma } from "../../../generated/prisma/client";
import type { CalendarSourceType } from "../dto/calendar.dto";
export declare const calendarEventSelect: {
    readonly id: true;
    readonly userId: true;
    readonly title: true;
    readonly type: true;
    readonly startAt: true;
    readonly endAt: true;
    readonly timezone: true;
    readonly reminders: true;
    readonly companyId: true;
    readonly contactId: true;
    readonly applicationId: true;
    readonly taskId: true;
    readonly projectId: true;
    readonly createdAt: true;
    readonly updatedAt: true;
    readonly deletedAt: true;
};
export type StoredCalendarEvent = Prisma.CalendarEventGetPayload<{
    select: typeof calendarEventSelect;
}>;
export type CalendarEvent = Omit<StoredCalendarEvent, "companyId" | "contactId" | "applicationId" | "taskId" | "projectId"> & {
    sourceEntityType: CalendarSourceType | null;
    sourceEntityId: string | null;
    sourceAvailable: boolean | null;
};
export type CalendarReminder = {
    id: string;
    eventId: string;
    title: string;
    type: CalendarEvent["type"];
    startAt: Date;
    timezone: string;
    minutesBefore: number;
    remindAt: Date;
};
//# sourceMappingURL=calendar.types.d.ts.map