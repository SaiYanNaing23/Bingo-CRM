import type { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../../shared/errors/app-error";
import type { CalendarRangeQuery } from "../dto/calendar.dto";

export const calendarValidationError = (field: string, message: string) =>
  new AppError("Validation failed", 400, { fieldErrors: { [field]: [message] } }, "VALIDATION_ERROR");

export const requireCalendarTimezone = async (tx: Prisma.TransactionClient, timezone: string) => {
  const [result] = await tx.$queryRaw<{ supported: boolean }[]>`
    SELECT EXISTS(SELECT 1 FROM pg_timezone_names WHERE lower(name) = lower(${timezone})) AS supported
  `;
  if (!result?.supported) throw calendarValidationError("timezone", "Use a supported named timezone");
};

export const validateCalendarSchedule = (event: { startAt: Date; endAt: Date | null; reminders: number[] }) => {
  if (event.endAt && event.endAt <= event.startAt)
    throw calendarValidationError("endAt", "endAt must be later than startAt");
  const earliest = event.startAt.getTime() - Math.max(0, ...event.reminders) * 60000;
  if (earliest < Date.parse("0001-01-01T00:00:00Z"))
    throw calendarValidationError("reminders", "Reminder times must be within years 0001 through 9999");
};

export const calendarWindow = async (tx: Prisma.TransactionClient, query: CalendarRangeQuery) => {
  await requireCalendarTimezone(tx, query.timezone);
  if (query.from && query.to) return { from: query.from, to: query.to };
  const view = query.view!;
  const interval = { day: "1 day", week: "1 week", month: "1 month" }[view];
  // Truncate/advance local wall time before converting each boundary to UTC.
  // https://www.postgresql.org/docs/current/functions-datetime.html
  const [range] = await tx.$queryRaw<{ from: Date; to: Date }[]>`
    WITH boundary AS (SELECT date_trunc(${view}::text, ${query.date!}::date::timestamp) AS local_start),
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
    throw calendarValidationError("date", "This local date has no supported calendar range");
  return range;
};
