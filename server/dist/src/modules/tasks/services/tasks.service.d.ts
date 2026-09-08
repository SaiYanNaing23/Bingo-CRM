import type { CreateTaskInput, TaskListQuery, TodayTasksQuery, UpdateTaskInput } from "../dto/tasks.dto";
export declare const createTask: (input: CreateTaskInput, userId: string) => Promise<{
    type: import("../../../generated/prisma").$Enums.TaskType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("../../../generated/prisma").$Enums.TaskStatus;
    userId: string;
    timezone: string;
    priority: import("../../../generated/prisma").$Enums.TaskPriority;
    dueDate: Date | null;
    repeatPattern: import("../../../generated/prisma").$Enums.TaskRepeatPattern;
    title: string;
    completedAt: Date | null;
    recurrenceSourceId: string | null;
}>;
export declare const getTask: (id: string, userId: string) => Promise<{
    type: import("../../../generated/prisma").$Enums.TaskType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("../../../generated/prisma").$Enums.TaskStatus;
    userId: string;
    timezone: string;
    priority: import("../../../generated/prisma").$Enums.TaskPriority;
    dueDate: Date | null;
    repeatPattern: import("../../../generated/prisma").$Enums.TaskRepeatPattern;
    title: string;
    completedAt: Date | null;
    recurrenceSourceId: string | null;
}>;
export declare const updateTask: (id: string, input: UpdateTaskInput, userId: string) => Promise<{
    type: import("../../../generated/prisma").$Enums.TaskType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("../../../generated/prisma").$Enums.TaskStatus;
    userId: string;
    timezone: string;
    priority: import("../../../generated/prisma").$Enums.TaskPriority;
    dueDate: Date | null;
    repeatPattern: import("../../../generated/prisma").$Enums.TaskRepeatPattern;
    title: string;
    completedAt: Date | null;
    recurrenceSourceId: string | null;
}>;
export declare const deleteTask: (id: string, userId: string) => Promise<void>;
export declare const completeTask: (id: string, userId: string) => Promise<{
    task: {
        type: import("../../../generated/prisma").$Enums.TaskType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("../../../generated/prisma").$Enums.TaskStatus;
        userId: string;
        timezone: string;
        priority: import("../../../generated/prisma").$Enums.TaskPriority;
        dueDate: Date | null;
        repeatPattern: import("../../../generated/prisma").$Enums.TaskRepeatPattern;
        title: string;
        completedAt: Date | null;
        recurrenceSourceId: string | null;
    };
    nextTask: {
        type: import("../../../generated/prisma").$Enums.TaskType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("../../../generated/prisma").$Enums.TaskStatus;
        userId: string;
        timezone: string;
        priority: import("../../../generated/prisma").$Enums.TaskPriority;
        dueDate: Date | null;
        repeatPattern: import("../../../generated/prisma").$Enums.TaskRepeatPattern;
        title: string;
        completedAt: Date | null;
        recurrenceSourceId: string | null;
    } | null;
}>;
export declare const listTasks: (query: TaskListQuery, userId: string) => Promise<{
    data: {
        type: import("../../../generated/prisma").$Enums.TaskType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("../../../generated/prisma").$Enums.TaskStatus;
        userId: string;
        timezone: string;
        priority: import("../../../generated/prisma").$Enums.TaskPriority;
        dueDate: Date | null;
        repeatPattern: import("../../../generated/prisma").$Enums.TaskRepeatPattern;
        title: string;
        completedAt: Date | null;
        recurrenceSourceId: string | null;
    }[];
    meta: import("../../../shared/types/api-response").PaginationMeta;
}>;
export declare const getTodayTasks: (query: TodayTasksQuery, userId: string, now?: Date) => Promise<{
    date: string;
    timezone: string;
    range: {
        from: Date;
        to: Date;
    };
    tasks: {
        type: import("../../../generated/prisma").$Enums.TaskType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("../../../generated/prisma").$Enums.TaskStatus;
        userId: string;
        timezone: string;
        priority: import("../../../generated/prisma").$Enums.TaskPriority;
        dueDate: Date | null;
        repeatPattern: import("../../../generated/prisma").$Enums.TaskRepeatPattern;
        title: string;
        completedAt: Date | null;
        recurrenceSourceId: string | null;
    }[];
    meta: import("../../../shared/types/api-response").PaginationMeta;
    summary: {
        dueToday: number;
        pendingToday: number;
        inProgressToday: number;
        completedToday: number;
        cancelledToday: number;
        overdue: number;
        unscheduled: number;
    };
}>;
//# sourceMappingURL=tasks.service.d.ts.map