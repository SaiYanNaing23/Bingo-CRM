import { z } from "zod";
export declare const projectStatusSchema: z.ZodEnum<{
    ARCHIVED: "ARCHIVED";
    IN_PROGRESS: "IN_PROGRESS";
    COMPLETED: "COMPLETED";
    PLANNED: "PLANNED";
    ON_HOLD: "ON_HOLD";
}>;
export declare const projectStateSchema: z.ZodObject<{
    status: z.ZodEnum<{
        ARCHIVED: "ARCHIVED";
        IN_PROGRESS: "IN_PROGRESS";
        COMPLETED: "COMPLETED";
        PLANNED: "PLANNED";
        ON_HOLD: "ON_HOLD";
    }>;
    progress: z.ZodNumber;
}, z.core.$strict>;
export declare const createProjectSchema: z.ZodObject<{
    githubUrl: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodURL>>>;
    liveDemoUrl: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodURL>>>;
    stack: z.ZodDefault<z.ZodPipe<z.ZodArray<z.ZodString>, z.ZodTransform<string[], string[]>>>;
    screenshots: z.ZodDefault<z.ZodPipe<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodURL>>, z.ZodTransform<string[], string[]>>>;
    lessonsLearned: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        ARCHIVED: "ARCHIVED";
        IN_PROGRESS: "IN_PROGRESS";
        COMPLETED: "COMPLETED";
        PLANNED: "PLANNED";
        ON_HOLD: "ON_HOLD";
    }>>;
    progress: z.ZodDefault<z.ZodNumber>;
    name: z.ZodString;
}, z.core.$strict>;
export declare const updateProjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    githubUrl: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodURL>>>;
    liveDemoUrl: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodURL>>>;
    stack: z.ZodOptional<z.ZodPipe<z.ZodArray<z.ZodString>, z.ZodTransform<string[], string[]>>>;
    screenshots: z.ZodOptional<z.ZodPipe<z.ZodArray<z.ZodPipe<z.ZodString, z.ZodURL>>, z.ZodTransform<string[], string[]>>>;
    lessonsLearned: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export declare const projectProgressSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        ARCHIVED: "ARCHIVED";
        IN_PROGRESS: "IN_PROGRESS";
        COMPLETED: "COMPLETED";
        PLANNED: "PLANNED";
        ON_HOLD: "ON_HOLD";
    }>>;
    progress: z.ZodOptional<z.ZodNumber>;
    content: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const projectCommentSchema: z.ZodObject<{
    content: z.ZodString;
}, z.core.$strict>;
export declare const projectIdSchema: z.ZodUUID;
export declare const projectActivityQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>, z.ZodNumber>>;
    limit: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>>;
}, z.core.$strict>;
export declare const projectListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>, z.ZodNumber>>;
    limit: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>>;
    status: z.ZodOptional<z.ZodEnum<{
        ARCHIVED: "ARCHIVED";
        IN_PROGRESS: "IN_PROGRESS";
        COMPLETED: "COMPLETED";
        PLANNED: "PLANNED";
        ON_HOLD: "ON_HOLD";
    }>>;
    stack: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        name: "name";
        progress: "progress";
    }>>;
    order: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strict>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectProgressInput = z.infer<typeof projectProgressSchema>;
export type ProjectCommentInput = z.infer<typeof projectCommentSchema>;
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;
export type ProjectActivityQuery = z.infer<typeof projectActivityQuerySchema>;
//# sourceMappingURL=projects.dto.d.ts.map