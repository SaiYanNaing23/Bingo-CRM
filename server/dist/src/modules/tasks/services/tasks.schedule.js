"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskDayWindow = exports.nextTaskDueDate = exports.requireTaskTimezone = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const requireTaskTimezone = async (tx, timezone) => {
    const [result] = await tx.$queryRaw `
    SELECT EXISTS(SELECT 1 FROM pg_timezone_names WHERE lower(name) = lower(${timezone})) AS supported
  `;
    if (!result?.supported) {
        throw new app_error_1.AppError("Unsupported timezone", 400, { fieldErrors: { timezone: ["Use a supported named timezone"] } }, "VALIDATION_ERROR");
    }
};
exports.requireTaskTimezone = requireTaskTimezone;
const nextTaskDueDate = async (tx, dueDate, timezone, pattern) => {
    const interval = { DAILY: "1 day", WEEKLY: "7 days", MONTHLY: "1 month" }[pattern];
    // Convert the UTC instant to local wall time, advance the calendar, then convert
    // back. PostgreSQL handles short months and DST gaps/folds using its timezone rules.
    // https://www.postgresql.org/docs/current/functions-datetime.html
    const [result] = await tx.$queryRaw `
    SELECT ((${dueDate.toISOString()}::timestamptz AT TIME ZONE ${timezone})
      + ${interval}::interval) AT TIME ZONE ${timezone} AS "dueDate"
  `;
    if (!result)
        throw new Error("Could not calculate the next task due date");
    return result.dueDate;
};
exports.nextTaskDueDate = nextTaskDueDate;
const taskDayWindow = async (tx, timezone, now) => {
    const [result] = await tx.$queryRaw `
    WITH local_day AS (
      SELECT date_trunc('day', ${now.toISOString()}::timestamptz AT TIME ZONE ${timezone}) AS midnight
    )
    SELECT to_char(midnight, 'YYYY-MM-DD') AS date,
      midnight AT TIME ZONE ${timezone} AS start,
      (midnight + interval '1 day') AT TIME ZONE ${timezone} AS end
    FROM local_day
  `;
    if (!result)
        throw new Error("Could not calculate today's task window");
    return result;
};
exports.taskDayWindow = taskDayWindow;
//# sourceMappingURL=tasks.schedule.js.map