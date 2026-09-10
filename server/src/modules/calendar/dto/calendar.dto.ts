import { z } from "zod";

export const calendarEventTypeSchema = z.enum(["INTERVIEW", "FOLLOW_UP", "DEADLINE", "OTHER"]);
export const calendarSourceTypes = ["COMPANY", "CONTACT", "APPLICATION", "TASK", "PROJECT"] as const;
export const calendarSourceTypeSchema = z.enum(calendarSourceTypes);
const text = z.string().refine(value => !value.includes("\0") && value.isWellFormed(), "Use valid Unicode text without NUL characters");
export const calendarTimestamp = z.iso.datetime({ offset: true })
  .refine(value => !/\.\d{4,}/.test(value), "Use at most millisecond precision")
  .pipe(z.coerce.date()).refine(value => value.getUTCFullYear() >= 1 && value.getUTCFullYear() <= 9999, "Use a year from 0001 through 9999");
export const calendarTimezone = text.trim().min(1).max(100).refine(value => {
  if (/^[+-]/.test(value)) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }); return true; }
  catch { return false; }
}, "Use a named timezone such as Asia/Yangon or UTC");
const sourceFields = { sourceEntityType: calendarSourceTypeSchema.nullable(), sourceEntityId: z.uuid().nullable() };
const fields = {
  title: text.trim().min(2).max(200), type: calendarEventTypeSchema,
  startAt: calendarTimestamp, endAt: calendarTimestamp.nullable(), timezone: calendarTimezone,
  reminders: z.array(z.number().int().min(0).max(10080)).max(5).transform(values => [...new Set(values)].sort((a, b) => a - b)),
  ...sourceFields,
};
const sourcePair = (value: { sourceEntityType?: unknown; sourceEntityId?: unknown }, ctx: z.RefinementCtx) => {
  if ((value.sourceEntityType === undefined) !== (value.sourceEntityId === undefined) ||
      (value.sourceEntityType === null) !== (value.sourceEntityId === null)) {
    ctx.addIssue({ code: "custom", path: ["sourceEntityId"], message: "Provide sourceEntityType and sourceEntityId together, or set both to null" });
  }
};
const interval = (value: { startAt?: Date | undefined; endAt?: Date | null | undefined }, ctx: z.RefinementCtx) => {
  if (value.startAt && value.endAt && value.endAt <= value.startAt)
    ctx.addIssue({ code: "custom", path: ["endAt"], message: "endAt must be later than startAt" });
};
export const createCalendarEventSchema = z.strictObject({
  ...fields, type: fields.type.default("OTHER"), endAt: fields.endAt.default(null),
  timezone: fields.timezone.default("UTC"), reminders: fields.reminders.default([]),
  sourceEntityType: sourceFields.sourceEntityType.optional(), sourceEntityId: sourceFields.sourceEntityId.optional(),
}).superRefine(sourcePair).superRefine(interval);
export const updateCalendarEventSchema = z.strictObject(fields).partial()
  .refine(value => Object.values(value).some(field => field !== undefined), "At least one event field is required")
  .superRefine(sourcePair).superRefine(interval);
export const calendarEventIdSchema = z.uuid();
const integer = z.string().regex(/^\d+$/).pipe(z.coerce.number<string>().int().positive().safe());
const pagination = { page: integer.pipe(z.number().max(1_000_000)).optional(), limit: integer.optional() };
const filters = {
  type: calendarEventTypeSchema.optional(), search: text.trim().max(200).optional(),
  sourceEntityType: calendarSourceTypeSchema.optional(), sourceEntityId: z.uuid().optional(),
};
const bounds = { from: calendarTimestamp.optional(), to: calendarTimestamp.optional() };
const checkBounds = (value: { from?: Date | undefined; to?: Date | undefined }, ctx: z.RefinementCtx, maxDays = 366) => {
  if ((value.from === undefined) !== (value.to === undefined))
    ctx.addIssue({ code: "custom", path: ["to"], message: "Provide from and to together" });
  if (value.from && value.to && (value.from >= value.to || value.to.getTime() - value.from.getTime() > maxDays * 86400000))
    ctx.addIssue({ code: "custom", path: ["to"], message: `Use an increasing range of at most ${maxDays} days` });
};
export const calendarEventListSchema = z.strictObject({
  ...pagination, ...filters, ...bounds,
  sortBy: z.enum(["startAt", "title", "createdAt", "updatedAt"]).default("startAt"),
  order: z.enum(["asc", "desc"]).default("asc"),
}).superRefine(sourcePair).superRefine((value, ctx) => checkBounds(value, ctx));
export const calendarRangeSchema = z.strictObject({
  ...pagination, ...filters, ...bounds, timezone: calendarTimezone.default("UTC"),
  view: z.enum(["day", "week", "month"]).optional(),
  date: z.iso.date().refine(value => !value.startsWith("0000"), "Use a year from 0001 through 9999").optional(),
}).superRefine(sourcePair).superRefine((value, ctx) => {
  checkBounds(value, ctx);
  const named = value.view !== undefined || value.date !== undefined;
  if (named ? (!value.view || !value.date || value.from !== undefined || value.to !== undefined) : (!value.from || !value.to))
    ctx.addIssue({ code: "custom", path: ["view"], message: "Use view with date, or from with to; do not mix the two modes" });
});
export const calendarReminderQuerySchema = z.strictObject({
  ...pagination, from: calendarTimestamp, to: calendarTimestamp,
}).superRefine((value, ctx) => checkBounds(value, ctx, 31));

export type CalendarSourceType = z.infer<typeof calendarSourceTypeSchema>;
export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;
export type CalendarEventListQuery = z.infer<typeof calendarEventListSchema>;
export type CalendarRangeQuery = z.infer<typeof calendarRangeSchema>;
export type CalendarReminderQuery = z.infer<typeof calendarReminderQuerySchema>;
