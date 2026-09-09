export declare const validateCreateProject: (input: unknown) => {
    stack: string[];
    screenshots: string[];
    status: "ARCHIVED" | "IN_PROGRESS" | "COMPLETED" | "PLANNED" | "ON_HOLD";
    progress: number;
    name: string;
    githubUrl?: string | null | undefined;
    liveDemoUrl?: string | null | undefined;
    lessonsLearned?: string | null | undefined;
};
export declare const validateUpdateProject: (input: unknown) => {
    name?: string | undefined;
    githubUrl?: string | null | undefined;
    liveDemoUrl?: string | null | undefined;
    stack?: string[] | undefined;
    screenshots?: string[] | undefined;
    lessonsLearned?: string | null | undefined;
};
export declare const validateProjectProgress: (input: unknown) => {
    status?: "ARCHIVED" | "IN_PROGRESS" | "COMPLETED" | "PLANNED" | "ON_HOLD" | undefined;
    progress?: number | undefined;
    content?: string | undefined;
};
export declare const validateProjectComment: (input: unknown) => {
    content: string;
};
export declare const validateProjectId: (input: unknown) => string;
export declare const validateProjectListQuery: (input: unknown) => {
    sortBy: "createdAt" | "updatedAt" | "name" | "progress";
    order: "asc" | "desc";
    page?: number | undefined;
    limit?: number | undefined;
    status?: "ARCHIVED" | "IN_PROGRESS" | "COMPLETED" | "PLANNED" | "ON_HOLD" | undefined;
    stack?: string | undefined;
    search?: string | undefined;
};
export declare const validateProjectActivityQuery: (input: unknown) => {
    page?: number | undefined;
    limit?: number | undefined;
};
//# sourceMappingURL=projects.validators.d.ts.map