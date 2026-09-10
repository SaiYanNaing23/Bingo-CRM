"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarWindow = exports.validateCalendarSchedule = exports.requireCalendarTimezone = exports.calendarValidationError = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const calendarValidationError = (field, message) => new app_error_1.AppError("Validation failed", 400, { fieldErrors: { [field]: [message] } }, "VALIDATION_ERROR");
exports.calendarValidationError = calendarValidationError;
const requireCalendarTimezone = async (tx, timezone) => {
    const [result] = await tx.$queryRaw `
    SELECT EXISTS(SELECT 1 FROM pg_timezone_names WHERE lower(name) = lower(${timezone})) AS supported
  `;
    if (!result?.supported)
        throw (0, exports.calendarValidationError)("timezone", "Use a supported named timezone");
};
exports.requireCalendarTimezone = requireCalendarTimezone;
const validateCalendarSchedule = (event) => {
    if (event.endAt && event.endAt <= event.startAt)
        throw (0, exports.calendarValidationError)("endAt", "endAt must be later than startAt");
    const earliest = event.startAt.getTime() - Math.max(0, ...event.reminders) * 60000;
    if (earliest < Date.parse("0001-01-01T00:00:00Z"))
        throw (0, exports.calendarValidationError)("reminders", "Reminder times must be within years 0001 through 9999");
};
exports.validateCalendarSchedule = validateCalendarSchedule;
const calendarWindow = async (tx, query) => {
    await (0, exports.requireCalendarTimezone)(tx, query.timezone);
    if (query.from && query.to)
        return { from: query.from, to: query.to };
    const view = query.view;
    const interval = { day: "1 day", week: "1 week", month: "1 month" }[view];
    // Truncate/advance local wall time before converting each boundary to UTC.
    // https://www.postgresql.org/docs/current/functions-datetime.html
    const [range] = await tx.$queryRaw `
    WITH boundary AS (SELECT date_trunc(${view}::text, ${query.date}::date::timestamp) AS local_start),
    utc_window AS (
      SELECT local_start AT TIME ZONE ${query.timezone} AS "from",
        (local_start + ${interval}::interval) AT TIME ZONE ${query.timezone} AS "to" FROM boundary
    )
    SELECT "from", "to" FROM utc_window
    WHERE "from" < "to"
      AND "from" >= TIMESTAMPTZ '0001-01-01 00:00:00+00'
      AND "to" < TIMESTAMPTZ '10000-01-01 00:00:00+00'
  `;
    if (!range || range.from >= range.to || range.from.getUTCFullYear() < 1 || range.to.getUTCFullYear() > 9999)
        throw (0, exports.calendarValidationError)("date", "This local date has no supported calendar range");
    return range;
};
exports.calendarWindow = calendarWindow;
//# sourceMappingURL=calendar.schedule.js.map