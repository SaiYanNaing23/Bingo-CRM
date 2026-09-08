export declare const validateCreateTask: (input: unknown) => {
    type: "JOB_APPLICATION" | "FOLLOW_UP" | "INTERVIEW" | "LEARNING" | "PROJECT" | "OTHER";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    timezone: string;
    status: "TODO" | "IN_PROGRESS" | "CANCELLED";
    repeatPattern: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
    title: string;
    dueDate?: Date | null | undefined;
};
export declare const validateUpdateTask: (input: unknown) => {
    title?: string | undefined;
    type?: "JOB_APPLICATION" | "FOLLOW_UP" | "INTERVIEW" | "LEARNING" | "PROJECT" | "OTHER" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dueDate?: Date | null | undefined;
    timezone?: string | undefined;
    status?: "TODO" | "IN_PROGRESS" | "CANCELLED" | undefined;
    repeatPattern?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | undefined;
};
export declare const validateCompleteTask: (input: unknown) => Record<string, never> | undefined;
export declare const validateTaskId: (input: unknown) => string;
export declare const validateTaskListQuery: (input: unknown) => {
    sortBy: "createdAt" | "updatedAt" | "priority" | "dueDate" | "title";
    order: "asc" | "desc";
    page?: number | undefined;
    limit?: number | undefined;
    type?: "JOB_APPLICATION" | "FOLLOW_UP" | "INTERVIEW" | "LEARNING" | "PROJECT" | "OTHER" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | undefined;
    repeatPattern?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | undefined;
    dueDateFrom?: Date | undefined;
    dueDateTo?: Date | undefined;
    search?: string | undefined;
};
export declare const validateTodayTasksQuery: (input: unknown) => {
    timezone: string;
    page?: number | undefined;
    limit?: number | undefined;
};
//# sourceMappingURL=tasks.validators.d.ts.map