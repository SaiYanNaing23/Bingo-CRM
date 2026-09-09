import type { Prisma } from "../../../generated/prisma/client";

export const projectSelect = {
  id: true, userId: true, name: true, githubUrl: true, liveDemoUrl: true, status: true,
  progress: true, stack: true, screenshots: true, lessonsLearned: true,
  createdAt: true, updatedAt: true, deletedAt: true,
} as const satisfies Prisma.ProjectSelect;

export const projectActivitySelect = {
  id: true, projectId: true, createdById: true, type: true, fromStatus: true, toStatus: true,
  fromProgress: true, toProgress: true, content: true, createdAt: true,
} as const satisfies Prisma.ProjectActivitySelect;

export type Project = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;
export type ProjectActivity = Prisma.ProjectActivityGetPayload<{ select: typeof projectActivitySelect }>;
