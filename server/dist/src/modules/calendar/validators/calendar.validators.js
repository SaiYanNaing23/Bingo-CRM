"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCalendarReminders = exports.validateCalendarRange = exports.validateCalendarEventList = exports.validateCalendarEventId = exports.validateUpdateCalendarEvent = exports.validateCreateCalendarEvent = void 0;
const calendar_dto_1 = require("../dto/calendar.dto");
const validateCreateCalendarEvent = (input) => calendar_dto_1.createCalendarEventSchema.parse(input);
exports.validateCreateCalendarEvent = validateCreateCalendarEvent;
const validateUpdateCalendarEvent = (input) => calendar_dto_1.updateCalendarEventSchema.parse(input);
exports.validateUpdateCalendarEvent = validateUpdateCalendarEvent;
const validateCalendarEventId = (input) => calendar_dto_1.calendarEventIdSchema.parse(input);
exports.validateCalendarEventId = validateCalendarEventId;
const validateCalendarEventList = (input) => calendar_dto_1.calendarEventListSchema.parse(input);
exports.validateCalendarEventList = validateCalendarEventList;
const validateCalendarRange = (input) => calendar_dto_1.calendarRangeSchema.parse(input);
exports.validateCalendarRange = validateCalendarRange;
const validateCalendarReminders = (input) => calendar_dto_1.calendarReminderQuerySchema.parse(input);
exports.validateCalendarReminders = validateCalendarReminders;
//# sourceMappingURL=calendar.validators.js.map