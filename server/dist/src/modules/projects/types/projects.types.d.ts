import type { Prisma } from "../../../generated/prisma/client";
export declare const projectSelect: {
    readonly id: true;
    readonly userId: true;
    readonly name: true;
    readonly githubUrl: true;
    readonly liveDemoUrl: true;
    readonly status: true;
    readonly progress: true;
    readonly stack: true;
    readonly screenshots: true;
    readonly lessonsLearned: true;
    readonly createdAt: true;
    readonly updatedAt: true;
    readonly deletedAt: true;
};
export declare const projectActivitySelect: {
    readonly id: true;
    readonly projectId: true;
    readonly createdById: true;
    readonly type: true;
    readonly fromStatus: true;
    readonly toStatus: true;
    readonly fromProgress: true;
    readonly toProgress: true;
    readonly content: true;
    readonly createdAt: true;
};
export type Project = Prisma.ProjectGetPayload<{
    select: typeof projectSelect;
}>;
export type ProjectActivity = Prisma.ProjectActivityGetPayload<{
    select: typeof projectActivitySelect;
}>;
//# sourceMappingURL=projects.types.d.ts.map