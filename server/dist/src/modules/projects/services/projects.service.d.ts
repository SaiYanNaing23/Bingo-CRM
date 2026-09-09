import { type CreateProjectInput, type UpdateProjectInput, type ProjectProgressInput, type ProjectCommentInput, type ProjectListQuery, type ProjectActivityQuery } from "../dto/projects.dto";
export declare const createProject: (input: CreateProjectInput, userId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    name: string;
    status: import("../../../generated/prisma").$Enums.ProjectStatus;
    userId: string;
    progress: number;
    githubUrl: string | null;
    liveDemoUrl: string | null;
    stack: string[];
    screenshots: string[];
    lessonsLearned: string | null;
}>;
export declare const getProject: (id: string, userId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    name: string;
    status: import("../../../generated/prisma").$Enums.ProjectStatus;
    userId: string;
    progress: number;
    githubUrl: string | null;
    liveDemoUrl: string | null;
    stack: string[];
    screenshots: string[];
    lessonsLearned: string | null;
}>;
export declare const updateProject: (id: string, input: UpdateProjectInput, userId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    name: string;
    status: import("../../../generated/prisma").$Enums.ProjectStatus;
    userId: string;
    progress: number;
    githubUrl: string | null;
    liveDemoUrl: string | null;
    stack: string[];
    screenshots: string[];
    lessonsLearned: string | null;
}>;
export declare const deleteProject: (id: string, userId: string) => Promise<void>;
export declare const listProjects: (query: ProjectListQuery, userId: string) => Promise<{
    data: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        name: string;
        status: import("../../../generated/prisma").$Enums.ProjectStatus;
        userId: string;
        progress: number;
        githubUrl: string | null;
        liveDemoUrl: string | null;
        stack: string[];
        screenshots: string[];
        lessonsLearned: string | null;
    }[];
    meta: import("../../../shared/types/api-response").PaginationMeta;
}>;
export declare const updateProjectProgress: (id: string, input: ProjectProgressInput, userId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    name: string;
    status: import("../../../generated/prisma").$Enums.ProjectStatus;
    userId: string;
    progress: number;
    githubUrl: string | null;
    liveDemoUrl: string | null;
    stack: string[];
    screenshots: string[];
    lessonsLearned: string | null;
}>;
export declare const createProjectComment: (id: string, input: ProjectCommentInput, userId: string) => Promise<{
    type: import("../../../generated/prisma").$Enums.ProjectActivityType;
    id: string;
    createdAt: Date;
    content: string | null;
    projectId: string;
    createdById: string;
    fromStatus: import("../../../generated/prisma").$Enums.ProjectStatus | null;
    toStatus: import("../../../generated/prisma").$Enums.ProjectStatus | null;
    fromProgress: number | null;
    toProgress: number | null;
}>;
export declare const listProjectActivities: (id: string, query: ProjectActivityQuery, userId: string) => Promise<{
    data: {
        type: import("../../../generated/prisma").$Enums.ProjectActivityType;
        id: string;
        createdAt: Date;
        content: string | null;
        projectId: string;
        createdById: string;
        fromStatus: import("../../../generated/prisma").$Enums.ProjectStatus | null;
        toStatus: import("../../../generated/prisma").$Enums.ProjectStatus | null;
        fromProgress: number | null;
        toProgress: number | null;
    }[];
    meta: import("../../../shared/types/api-response").PaginationMeta;
}>;
//# sourceMappingURL=projects.service.d.ts.map