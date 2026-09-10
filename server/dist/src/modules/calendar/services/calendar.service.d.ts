import type { CreateCalendarEventInput, UpdateCalendarEventInput, CalendarEventListQuery, CalendarRangeQuery, CalendarReminderQuery } from "../dto/calendar.dto";
export declare const createCalendarEvent: (input: CreateCalendarEventInput, userId: string) => Promise<import("../types/calendar.types").CalendarEvent>;
export declare const getCalendarEvent: (id: string, userId: string) => Promise<import("../types/calendar.types").CalendarEvent>;
export declare const updateCalendarEvent: (id: string, input: UpdateCalendarEventInput, userId: string) => Promise<import("../types/calendar.types").CalendarEvent>;
export declare const deleteCalendarEvent: (id: string, userId: string) => Promise<void>;
export declare const listCalendarEvents: (query: CalendarEventListQuery, userId: string) => Promise<{
    data: import("../types/calendar.types").CalendarEvent[];
    meta: import("../../../shared/types/api-response").PaginationMeta;
}>;
export declare const getCalendarRange: (query: CalendarRangeQuery, userId: string) => Promise<{
    view: string;
    timezone: string;
    range: {
        from: Date;
        to: Date;
    };
    events: import("../types/calendar.types").CalendarEvent[];
    meta: import("../../../shared/types/api-response").PaginationMeta;
}>;
export declare const listCalendarReminders: (query: CalendarReminderQuery, userId: string) => Promise<{
    data: {
        type: import("../types/calendar.types").CalendarEvent["type"];
        timezone: string;
        title: string;
        startAt: Date;
        eventId: string;
        minutesBefore: number;
        remindAt: Date;
        id: string;
    }[];
    meta: import("../../../shared/types/api-response").PaginationMeta;
}>;
//# sourceMappingURL=calendar.service.d.ts.map