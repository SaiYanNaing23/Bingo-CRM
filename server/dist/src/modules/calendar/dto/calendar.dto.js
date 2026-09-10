"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarReminderQuerySchema = exports.calendarRangeSchema = exports.calendarEventListSchema = exports.calendarEventIdSchema = exports.updateCalendarEventSchema = exports.createCalendarEventSchema = exports.calendarTimezone = exports.calendarTimestamp = exports.calendarSourceTypeSchema = exports.calendarSourceTypes = exports.calendarEventTypeSchema = void 0;
const zod_1 = require("zod");
exports.calendarEventTypeSchema = zod_1.z.enum(["INTERVIEW", "FOLLOW_UP", "DEADLINE", "OTHER"]);
exports.calendarSourceTypes = ["COMPANY", "CONTACT", "APPLICATION", "TASK", "PROJECT"];
exports.calendarSourceTypeSchema = zod_1.z.enum(exports.calendarSourceTypes);
const text = zod_1.z.string().refine(value => !value.includes("\0") && value.isWellFormed(), "Use valid Unicode text without NUL characters");
exports.calendarTimestamp = zod_1.z.iso.datetime({ offset: true })
    .refine(value => !/\.\d{4,}/.test(value), "Use at most millisecond precision")
    .pipe(zod_1.z.coerce.date()).refine(value => value.getUTCFullYear() >= 1 && value.getUTCFullYear() <= 9999, "Use a year from 0001 through 9999");
exports.calendarTimezone = text.trim().min(1).max(100).refine(value => {
    if (/^[+-]/.test(value))
        return false;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: value });
        return true;
    }
    catch {
        return false;
    }
}, "Use a named timezone such as Asia/Yangon or UTC");
const sourceFields = { sourceEntityType: exports.calendarSourceTypeSchema.nullable(), sourceEntityId: zod_1.z.uuid().nullable() };
const fields = {
    title: text.trim().min(2).max(200), type: exports.calendarEventTypeSchema,
    startAt: exports.calendarTimestamp, endAt: exports.calendarTimestamp.nullable(), timezone: exports.calendarTimezone,
    reminders: zod_1.z.array(zod_1.z.number().int().min(0).max(10080)).max(5).transform(values => [...new Set(values)].sort((a, b) => a - b)),
    ...sourceFields,
};
const sourcePair = (value, ctx) => {
    if ((value.sourceEntityType === undefined) !== (value.sourceEntityId === undefined) ||
        (value.sourceEntityType === null) !== (value.sourceEntityId === null)) {
        ctx.addIssue({ code: "custom", path: ["sourceEntityId"], message: "Provide sourceEntityType and sourceEntityId together, or set both to null" });
    }
};
const interval = (value, ctx) => {
    if (value.startAt && value.endAt && value.endAt <= value.startAt)
        ctx.addIssue({ code: "custom", path: ["endAt"], message: "endAt must be later than startAt" });
};
exports.createCalendarEventSchema = zod_1.z.strictObject({
    ...fields, type: fields.type.default("OTHER"), endAt: fields.endAt.default(null),
    timezone: fields.timezone.default("UTC"), reminders: fields.reminders.default([]),
    sourceEntityType: sourceFields.sourceEntityType.optional(), sourceEntityId: sourceFields.sourceEntityId.optional(),
}).superRefine(sourcePair).superRefine(interval);
exports.updateCalendarEventSchema = zod_1.z.strictObject(fields).partial()
    .refine(value => Object.values(value).some(field => field !== undefined), "At least one event field is required")
    .superRefine(sourcePair).superRefine(interval);
exports.calendarEventIdSchema = zod_1.z.uuid();
const integer = zod_1.z.string().regex(/^\d+$/).pipe(zod_1.z.coerce.number().int().positive().safe());
const pagination = { page: integer.pipe(zod_1.z.number().max(1_000_000)).optional(), limit: integer.optional() };
const filters = {
    type: exports.calendarEventTypeSchema.optional(), search: text.trim().max(200).optional(),
    sourceEntityType: exports.calendarSourceTypeSchema.optional(), sourceEntityId: zod_1.z.uuid().optional(),
};
const bounds = { from: exports.calendarTimestamp.optional(), to: exports.calendarTimestamp.optional() };
const checkBounds = (value, ctx, maxDays = 366) => {
    if ((value.from === undefined) !== (value.to === undefined))
        ctx.addIssue({ code: "custom", path: ["to"], message: "Provide from and to together" });
    if (value.from && value.to && (value.from >= value.to || value.to.getTime() - value.from.getTime() > maxDays * 86400000))
        ctx.addIssue({ code: "custom", path: ["to"], message: `Use an increasing range of at most ${maxDays} days` });
};
exports.calendarEventListSchema = zod_1.z.strictObject({
    ...pagination, ...filters, ...bounds,
    sortBy: zod_1.z.enum(["startAt", "title", "createdAt", "updatedAt"]).default("startAt"),
    order: zod_1.z.enum(["asc", "desc"]).default("asc"),
}).superRefine(sourcePair).superRefine((value, ctx) => checkBounds(value, ctx));
exports.calendarRangeSchema = zod_1.z.strictObject({
    ...pagination, ...filters, ...bounds, timezone: exports.calendarTimezone.default("UTC"),
    view: zod_1.z.enum(["day", "week", "month"]).optional(),
    date: zod_1.z.iso.date().refine(value => !value.startsWith("0000"), "Use a year from 0001 through 9999").optional(),
}).superRefine(sourcePair).superRefine((value, ctx) => {
    checkBounds(value, ctx);
    const named = value.view !== undefined || value.date !== undefined;
    if (named ? (!value.view || !value.date || value.from !== undefined || value.to !== undefined) : (!value.from || !value.to))
        ctx.addIssue({ code: "custom", path: ["view"], message: "Use view with date, or from with to; do not mix the two modes" });
});
exports.calendarReminderQuerySchema = zod_1.z.strictObject({
    ...pagination, from: exports.calendarTimestamp, to: exports.calendarTimestamp,
}).superRefine((value, ctx) => checkBounds(value, ctx, 31));
//# sourceMappingURL=calendar.dto.js.map