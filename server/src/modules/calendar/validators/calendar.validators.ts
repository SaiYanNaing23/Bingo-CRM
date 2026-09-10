import { createCalendarEventSchema, updateCalendarEventSchema, calendarEventIdSchema,
  calendarEventListSchema, calendarRangeSchema, calendarReminderQuerySchema } from "../dto/calendar.dto";

export const validateCreateCalendarEvent = (input: unknown) => createCalendarEventSchema.parse(input);
export const validateUpdateCalendarEvent = (input: unknown) => updateCalendarEventSchema.parse(input);
export const validateCalendarEventId = (input: unknown) => calendarEventIdSchema.parse(input);
export const validateCalendarEventList = (input: unknown) => calendarEventListSchema.parse(input);
export const validateCalendarRange = (input: unknown) => calendarRangeSchema.parse(input);
export const validateCalendarReminders = (input: unknown) => calendarReminderQuerySchema.parse(input);
