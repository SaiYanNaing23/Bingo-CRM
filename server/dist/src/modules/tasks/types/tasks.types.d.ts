import type { Prisma } from "../../../generated/prisma/client";
export declare const taskSelect: {
    readonly id: true;
    readonly userId: true;
    readonly title: true;
    readonly type: true;
    readonly priority: true;
    readonly dueDate: true;
    readonly timezone: true;
    readonly status: true;
    readonly repeatPattern: true;
    readonly completedAt: true;
    readonly recurrenceSourceId: true;
    readonly createdAt: true;
    readonly updatedAt: true;
    readonly deletedAt: true;
};
export type Task = Prisma.TaskGetPayload<{
    select: typeof taskSelect;
}>;
//# sourceMappingURL=tasks.types.d.ts.map