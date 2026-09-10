import type { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../../shared/errors/app-error";
import type { CalendarRangeQuery } from "../dto/calendar.dto";
export declare const calendarValidationError: (field: string, message: string) => AppError;
export declare const requireCalendarTimezone: (tx: Prisma.TransactionClient, timezone: string) => Promise<void>;
export declare const validateCalendarSchedule: (event: {
    startAt: Date;
    endAt: Date | null;
    reminders: number[];
}) => void;
export declare const calendarWindow: (tx: Prisma.TransactionClient, query: CalendarRangeQuery) => Promise<{
    from: Date;
    to: Date;
}>;
//# sourceMappingURL=calendar.schedule.d.ts.map