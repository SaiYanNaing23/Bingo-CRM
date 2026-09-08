import type { Prisma } from "../../../generated/prisma/client";

export const taskSelect = {
  id: true, userId: true, title: true, type: true, priority: true, dueDate: true,
  timezone: true, status: true, repeatPattern: true, completedAt: true,
  recurrenceSourceId: true, createdAt: true, updatedAt: true, deletedAt: true,
} as const satisfies Prisma.TaskSelect;

export type Task = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;
