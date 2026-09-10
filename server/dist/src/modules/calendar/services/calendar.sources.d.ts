import { Prisma } from "../../../generated/prisma/client";
import { type CalendarSourceType } from "../dto/calendar.dto";
import type { CalendarEvent, StoredCalendarEvent } from "../types/calendar.types";
export declare const sourceColumns: {
    readonly COMPANY: "companyId";
    readonly CONTACT: "contactId";
    readonly APPLICATION: "applicationId";
    readonly TASK: "taskId";
    readonly PROJECT: "projectId";
};
export declare const sourceFields: (type: CalendarSourceType | null | undefined, id: string | null | undefined) => Record<"companyId" | "applicationId" | "projectId" | "contactId" | "taskId", string | null>;
export declare const requireCalendarSource: (tx: Prisma.TransactionClient, type: CalendarSourceType, id: string, userId: string) => Promise<void>;
export declare const serializeCalendarEvents: (tx: Prisma.TransactionClient, rows: StoredCalendarEvent[], userId: string) => Promise<CalendarEvent[]>;
//# sourceMappingURL=calendar.sources.d.ts.map