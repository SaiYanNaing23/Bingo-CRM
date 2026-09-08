import { type ApplicationHistoryQuery, type ApplicationListQuery, type ApplicationStageUpdate, type CreateApplicationInput, type UpdateApplicationInput } from "../dto/applications.dto";
export declare const createApplication: (input: CreateApplicationInput, userId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    notes: string | null;
    userId: string;
    companyId: string;
    dateApplied: Date | null;
    salary: string | null;
    timezone: string;
    recruiter: string | null;
    stage: import("../../../generated/prisma").$Enums.ApplicationStage;
    position: string;
}>;
export declare const getApplication: (id: string, userId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    notes: string | null;
    userId: string;
    companyId: string;
    dateApplied: Date | null;
    salary: string | null;
    timezone: string;
    recruiter: string | null;
    stage: import("../../../generated/prisma").$Enums.ApplicationStage;
    position: string;
}>;
export declare const updateApplication: (id: string, input: UpdateApplicationInput, userId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    notes: string | null;
    userId: string;
    companyId: string;
    dateApplied: Date | null;
    salary: string | null;
    timezone: string;
    recruiter: string | null;
    stage: import("../../../generated/prisma").$Enums.ApplicationStage;
    position: string;
}>;
export declare const deleteApplication: (id: string, userId: string) => Promise<void>;
export declare const listApplications: (query: ApplicationListQuery, userId: string) => Promise<{
    data: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        notes: string | null;
        userId: string;
        companyId: string;
        dateApplied: Date | null;
        salary: string | null;
        timezone: string;
        recruiter: string | null;
        stage: import("../../../generated/prisma").$Enums.ApplicationStage;
        position: string;
    }[];
    meta: import("../../../shared/types/api-response").PaginationMeta;
}>;
export declare const transitionApplicationStage: (id: string, input: ApplicationStageUpdate, userId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    notes: string | null;
    userId: string;
    companyId: string;
    dateApplied: Date | null;
    salary: string | null;
    timezone: string;
    recruiter: string | null;
    stage: import("../../../generated/prisma").$Enums.ApplicationStage;
    position: string;
}>;
export declare const listApplicationStageHistory: (id: string, query: ApplicationHistoryQuery, userId: string) => Promise<{
    data: {
        id: string;
        createdAt: Date;
        applicationId: string;
        fromStage: import("../../../generated/prisma").$Enums.ApplicationStage | null;
        toStage: import("../../../generated/prisma").$Enums.ApplicationStage;
        changedById: string;
    }[];
    meta: import("../../../shared/types/api-response").PaginationMeta;
}>;
//# sourceMappingURL=applications.service.d.ts.map