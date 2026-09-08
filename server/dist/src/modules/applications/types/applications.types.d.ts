import type { Prisma } from "../../../generated/prisma/client";
export declare const applicationSelect: {
    readonly id: true;
    readonly userId: true;
    readonly companyId: true;
    readonly position: true;
    readonly dateApplied: true;
    readonly salary: true;
    readonly timezone: true;
    readonly recruiter: true;
    readonly stage: true;
    readonly notes: true;
    readonly createdAt: true;
    readonly updatedAt: true;
    readonly deletedAt: true;
};
export declare const stageHistorySelect: {
    readonly id: true;
    readonly applicationId: true;
    readonly fromStage: true;
    readonly toStage: true;
    readonly changedById: true;
    readonly createdAt: true;
};
export type Application = Prisma.ApplicationGetPayload<{
    select: typeof applicationSelect;
}>;
//# sourceMappingURL=applications.types.d.ts.map