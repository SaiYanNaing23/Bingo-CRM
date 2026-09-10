export declare const validateCreateCalendarEvent: (input: unknown) => {
    type: "FOLLOW_UP" | "INTERVIEW" | "OTHER" | "DEADLINE";
    endAt: Date | null;
    timezone: string;
    reminders: number[];
    title: string;
    startAt: Date;
    sourceEntityType?: "PROJECT" | "COMPANY" | "CONTACT" | "APPLICATION" | "TASK" | null | undefined;
    sourceEntityId?: string | null | undefined;
};
export declare const validateUpdateCalendarEvent: (input: unknown) => {
    sourceEntityType?: "PROJECT" | "COMPANY" | "CONTACT" | "APPLICATION" | "TASK" | null | undefined;
    sourceEntityId?: string | null | undefined;
    title?: string | undefined;
    type?: "FOLLOW_UP" | "INTERVIEW" | "OTHER" | "DEADLINE" | undefined;
    startAt?: Date | undefined;
    endAt?: Date | null | undefined;
    timezone?: string | undefined;
    reminders?: number[] | undefined;
};
export declare const validateCalendarEventId: (input: unknown) => string;
export declare const validateCalendarEventList: (input: unknown) => {
    sortBy: "createdAt" | "updatedAt" | "title" | "startAt";
    order: "asc" | "desc";
    from?: Date | undefined;
    to?: Date | undefined;
    type?: "FOLLOW_UP" | "INTERVIEW" | "OTHER" | "DEADLINE" | undefined;
    search?: string | undefined;
    sourceEntityType?: "PROJECT" | "COMPANY" | "CONTACT" | "APPLICATION" | "TASK" | undefined;
    sourceEntityId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
};
export declare const validateCalendarRange: (input: unknown) => {
    timezone: string;
    view?: "week" | "day" | "month" | undefined;
    date?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
    type?: "FOLLOW_UP" | "INTERVIEW" | "OTHER" | "DEADLINE" | undefined;
    search?: string | undefined;
    sourceEntityType?: "PROJECT" | "COMPANY" | "CONTACT" | "APPLICATION" | "TASK" | undefined;
    sourceEntityId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
};
export declare const validateCalendarReminders: (input: unknown) => {
    from: Date;
    to: Date;
    page?: number | undefined;
    limit?: number | undefined;
};
//# sourceMappingURL=calendar.validators.d.ts.map