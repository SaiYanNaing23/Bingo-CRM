import type { Prisma } from "../../../generated/prisma/client";
import type { Task } from "../types/tasks.types";
export declare const requireTaskTimezone: (tx: Prisma.TransactionClient, timezone: string) => Promise<void>;
export declare const nextTaskDueDate: (tx: Prisma.TransactionClient, dueDate: Date, timezone: string, pattern: Exclude<Task["repeatPattern"], "NONE">) => Promise<Date>;
export declare const taskDayWindow: (tx: Prisma.TransactionClient, timezone: string, now: Date) => Promise<{
    date: string;
    start: Date;
    end: Date;
}>;
//# sourceMappingURL=tasks.schedule.d.ts.map