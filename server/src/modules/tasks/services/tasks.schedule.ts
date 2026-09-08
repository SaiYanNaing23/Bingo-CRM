import type { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../../shared/errors/app-error";
import type { Task } from "../types/tasks.types";

export const requireTaskTimezone = async (tx: Prisma.TransactionClient, timezone: string) => {
  const [result] = await tx.$queryRaw<{ supported: boolean }[]>`
    SELECT EXISTS(SELECT 1 FROM pg_timezone_names WHERE lower(name) = lower(${timezone})) AS supported
  `;
  if (!result?.supported) {
    throw new AppError("Unsupported timezone", 400, { fieldErrors: { timezone: ["Use a supported named timezone"] } }, "VALIDATION_ERROR");
  }
};

export const nextTaskDueDate = async (
  tx: Prisma.TransactionClient, dueDate: Date, timezone: string,
  pattern: Exclude<Task["repeatPattern"], "NONE">,
): Promise<Date> => {
  const interval = { DAILY: "1 day", WEEKLY: "7 days", MONTHLY: "1 month" }[pattern];
  // Convert the UTC instant to local wall time, advance the calendar, then convert
  // back. PostgreSQL handles short months and DST gaps/folds using its timezone rules.
  // https://www.postgresql.org/docs/current/functions-datetime.html
  const [result] = await tx.$queryRaw<{ dueDate: Date }[]>`
    SELECT ((${dueDate.toISOString()}::timestamptz AT TIME ZONE ${timezone})
      + ${interval}::interval) AT TIME ZONE ${timezone} AS "dueDate"
  `;
  if (!result) throw new Error("Could not calculate the next task due date");
  return result.dueDate;
};

export const taskDayWindow = async (tx: Prisma.TransactionClient, timezone: string, now: Date) => {
  const [result] = await tx.$queryRaw<{ date: string; start: Date; end: Date }[]>`
    WITH local_day AS (
      SELECT date_trunc('day', ${now.toISOString()}::timestamptz AT TIME ZONE ${timezone}) AS midnight
    )
    SELECT to_char(midnight, 'YYYY-MM-DD') AS date,
      midnight AT TIME ZONE ${timezone} AS start,
      (midnight + interval '1 day') AT TIME ZONE ${timezone} AS end
    FROM local_day
  `;
  if (!result) throw new Error("Could not calculate today's task window");
  return result;
};
