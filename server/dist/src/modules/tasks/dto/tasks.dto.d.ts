import { z } from "zod";
export declare const taskTypeSchema: z.ZodEnum<{
    JOB_APPLICATION: "JOB_APPLICATION";
    FOLLOW_UP: "FOLLOW_UP";
    INTERVIEW: "INTERVIEW";
    LEARNING: "LEARNING";
    PROJECT: "PROJECT";
    OTHER: "OTHER";
}>;
export declare const taskPrioritySchema: z.ZodEnum<{
    LOW: "LOW";
    MEDIUM: "MEDIUM";
    HIGH: "HIGH";
    URGENT: "URGENT";
}>;
export declare const taskStatusSchema: z.ZodEnum<{
    TODO: "TODO";
    IN_PROGRESS: "IN_PROGRESS";
    COMPLETED: "COMPLETED";
    CANCELLED: "CANCELLED";
}>;
export declare const taskRepeatPatternSchema: z.ZodEnum<{
    NONE: "NONE";
    DAILY: "DAILY";
    WEEKLY: "WEEKLY";
    MONTHLY: "MONTHLY";
}>;
export declare const createTaskSchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodEnum<{
        JOB_APPLICATION: "JOB_APPLICATION";
        FOLLOW_UP: "FOLLOW_UP";
        INTERVIEW: "INTERVIEW";
        LEARNING: "LEARNING";
        PROJECT: "PROJECT";
        OTHER: "OTHER";
    }>>;
    priority: z.ZodDefault<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>>;
    timezone: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        TODO: "TODO";
        IN_PROGRESS: "IN_PROGRESS";
        CANCELLED: "CANCELLED";
    }>>;
    repeatPattern: z.ZodDefault<z.ZodEnum<{
        NONE: "NONE";
        DAILY: "DAILY";
        WEEKLY: "WEEKLY";
        MONTHLY: "MONTHLY";
    }>>;
    title: z.ZodString;
}, z.core.$strict>;
export declare const updateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        JOB_APPLICATION: "JOB_APPLICATION";
        FOLLOW_UP: "FOLLOW_UP";
        INTERVIEW: "INTERVIEW";
        LEARNING: "LEARNING";
        PROJECT: "PROJECT";
        OTHER: "OTHER";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>>;
    timezone: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        TODO: "TODO";
        IN_PROGRESS: "IN_PROGRESS";
        CANCELLED: "CANCELLED";
    }>>;
    repeatPattern: z.ZodOptional<z.ZodEnum<{
        NONE: "NONE";
        DAILY: "DAILY";
        WEEKLY: "WEEKLY";
        MONTHLY: "MONTHLY";
    }>>;
}, z.core.$strict>;
export declare const completeTaskSchema: z.ZodOptional<z.ZodObject<{}, z.core.$strict>>;
export declare const taskIdSchema: z.ZodUUID;
export declare const taskListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    type: z.ZodOptional<z.ZodEnum<{
        JOB_APPLICATION: "JOB_APPLICATION";
        FOLLOW_UP: "FOLLOW_UP";
        INTERVIEW: "INTERVIEW";
        LEARNING: "LEARNING";
        PROJECT: "PROJECT";
        OTHER: "OTHER";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        TODO: "TODO";
        IN_PROGRESS: "IN_PROGRESS";
        COMPLETED: "COMPLETED";
        CANCELLED: "CANCELLED";
    }>>;
    repeatPattern: z.ZodOptional<z.ZodEnum<{
        NONE: "NONE";
        DAILY: "DAILY";
        WEEKLY: "WEEKLY";
        MONTHLY: "MONTHLY";
    }>>;
    dueDateFrom: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
    dueDateTo: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        priority: "priority";
        dueDate: "dueDate";
        title: "title";
    }>>;
    order: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strict>;
export declare const todayTasksQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    timezone: z.ZodDefault<z.ZodString>;
}, z.core.$strict>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
export type TodayTasksQuery = z.infer<typeof todayTasksQuerySchema>;
//# sourceMappingURL=tasks.dto.d.ts.map