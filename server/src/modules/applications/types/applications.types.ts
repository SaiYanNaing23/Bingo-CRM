import type { Prisma } from "../../../generated/prisma/client";

export const applicationSelect = {
  id: true, userId: true, companyId: true, position: true,
  dateApplied: true, salary: true, timezone: true, recruiter: true,
  stage: true, notes: true, createdAt: true, updatedAt: true, deletedAt: true,
} as const satisfies Prisma.ApplicationSelect;

export const stageHistorySelect = {
  id: true, applicationId: true, fromStage: true, toStage: true,
  changedById: true, createdAt: true,
} as const satisfies Prisma.ApplicationStageHistorySelect;

export type Application = Prisma.ApplicationGetPayload<{ select: typeof applicationSelect }>;
