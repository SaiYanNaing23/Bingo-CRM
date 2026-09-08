import {
  completeTaskSchema, createTaskSchema, taskIdSchema, taskListQuerySchema,
  todayTasksQuerySchema, updateTaskSchema,
} from "../dto/tasks.dto";

export const validateCreateTask = (input: unknown) => createTaskSchema.parse(input);
export const validateUpdateTask = (input: unknown) => updateTaskSchema.parse(input);
export const validateCompleteTask = (input: unknown) => completeTaskSchema.parse(input);
export const validateTaskId = (input: unknown) => taskIdSchema.parse(input);
export const validateTaskListQuery = (input: unknown) => taskListQuerySchema.parse(input);
export const validateTodayTasksQuery = (input: unknown) => todayTasksQuerySchema.parse(input);
