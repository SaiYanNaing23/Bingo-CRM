import { z } from "zod";
export declare const calendarEventTypeSchema: z.ZodEnum<{
    FOLLOW_UP: "FOLLOW_UP";
    INTERVIEW: "INTERVIEW";
    OTHER: "OTHER";
    DEADLINE: "DEADLINE";
}>;
export declare const calendarSourceTypes: readonly ["COMPANY", "CONTACT", "APPLICATION", "TASK", "PROJECT"];
export declare const calendarSourceTypeSchema: z.ZodEnum<{
    PROJECT: "PROJECT";
    COMPANY: "COMPANY";
    CONTACT: "CONTACT";
    APPLICATION: "APPLICATION";
    TASK: "TASK";
}>;
export declare const calendarTimestamp: z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>;
export declare const calendarTimezone: z.ZodString;
export declare const createCalendarEventSchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodEnum<{
        FOLLOW_UP: "FOLLOW_UP";
        INTERVIEW: "INTERVIEW";
        OTHER: "OTHER";
        DEADLINE: "DEADLINE";
    }>>;
    endAt: z.ZodDefault<z.ZodNullable<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>>;
    timezone: z.ZodDefault<z.ZodString>;
    reminders: z.ZodDefault<z.ZodPipe<z.ZodArray<z.ZodNumber>, z.ZodTransform<number[], number[]>>>;
    sourceEntityType: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        PROJECT: "PROJECT";
        COMPANY: "COMPANY";
        CONTACT: "CONTACT";
        APPLICATION: "APPLICATION";
        TASK: "TASK";
    }>>>;
    sourceEntityId: z.ZodOptional<z.ZodNullable<z.ZodUUID>>;
    title: z.ZodString;
    startAt: z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>;
}, z.core.$strict>;
export declare const updateCalendarEventSchema: z.ZodObject<{
    sourceEntityType: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        PROJECT: "PROJECT";
        COMPANY: "COMPANY";
        CONTACT: "CONTACT";
        APPLICATION: "APPLICATION";
        TASK: "TASK";
    }>>>;
    sourceEntityId: z.ZodOptional<z.ZodNullable<z.ZodUUID>>;
    title: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        FOLLOW_UP: "FOLLOW_UP";
        INTERVIEW: "INTERVIEW";
        OTHER: "OTHER";
        DEADLINE: "DEADLINE";
    }>>;
    startAt: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
    endAt: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>>;
    timezone: z.ZodOptional<z.ZodString>;
    reminders: z.ZodOptional<z.ZodPipe<z.ZodArray<z.ZodNumber>, z.ZodTransform<number[], number[]>>>;
}, z.core.$strict>;
export declare const calendarEventIdSchema: z.ZodUUID;
export declare const calendarEventListSchema: z.ZodObject<{
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        title: "title";
        startAt: "startAt";
    }>>;
    order: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    from: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
    to: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
    type: z.ZodOptional<z.ZodEnum<{
        FOLLOW_UP: "FOLLOW_UP";
        INTERVIEW: "INTERVIEW";
        OTHER: "OTHER";
        DEADLINE: "DEADLINE";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    sourceEntityType: z.ZodOptional<z.ZodEnum<{
        PROJECT: "PROJECT";
        COMPANY: "COMPANY";
        CONTACT: "CONTACT";
        APPLICATION: "APPLICATION";
        TASK: "TASK";
    }>>;
    sourceEntityId: z.ZodOptional<z.ZodUUID>;
    page: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>, z.ZodNumber>>;
    limit: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>>;
}, z.core.$strict>;
export declare const calendarRangeSchema: z.ZodObject<{
    timezone: z.ZodDefault<z.ZodString>;
    view: z.ZodOptional<z.ZodEnum<{
        week: "week";
        day: "day";
        month: "month";
    }>>;
    date: z.ZodOptional<z.ZodISODate>;
    from: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
    to: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
    type: z.ZodOptional<z.ZodEnum<{
        FOLLOW_UP: "FOLLOW_UP";
        INTERVIEW: "INTERVIEW";
        OTHER: "OTHER";
        DEADLINE: "DEADLINE";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    sourceEntityType: z.ZodOptional<z.ZodEnum<{
        PROJECT: "PROJECT";
        COMPANY: "COMPANY";
        CONTACT: "CONTACT";
        APPLICATION: "APPLICATION";
        TASK: "TASK";
    }>>;
    sourceEntityId: z.ZodOptional<z.ZodUUID>;
    page: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>, z.ZodNumber>>;
    limit: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>>;
}, z.core.$strict>;
export declare const calendarReminderQuerySchema: z.ZodObject<{
    from: z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>;
    to: z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>;
    page: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>, z.ZodNumber>>;
    limit: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>>;
}, z.core.$strict>;
export type CalendarSourceType = z.infer<typeof calendarSourceTypeSchema>;
export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;
export type CalendarEventListQuery = z.infer<typeof calendarEventListSchema>;
export type CalendarRangeQuery = z.infer<typeof calendarRangeSchema>;
export type CalendarReminderQuery = z.infer<typeof calendarReminderQuerySchema>;
//# sourceMappingURL=calendar.dto.d.ts.map