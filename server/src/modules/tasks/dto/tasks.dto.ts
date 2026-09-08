import { z } from "zod";

export const taskTypeSchema = z.enum(["JOB_APPLICATION", "FOLLOW_UP", "INTERVIEW", "LEARNING", "PROJECT", "OTHER"]);
export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const taskRepeatPatternSchema = z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]);
const editableStatus = z.enum(["TODO", "IN_PROGRESS", "CANCELLED"]);
const timestamp = z.iso.datetime({ offset: true }).pipe(z.coerce.date());
const timezone = z.string().trim().min(1).max(100).refine((value) => {
  if (/^[+-]/.test(value)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, "Invalid timezone; use a named timezone such as Asia/Yangon or UTC");

const fields = {
  title: z.string().trim().min(2).max(200),
  type: taskTypeSchema,
  priority: taskPrioritySchema,
  dueDate: timestamp.nullable(),
  timezone,
  status: editableStatus,
  repeatPattern: taskRepeatPatternSchema,
};

export const createTaskSchema = z.strictObject({
  ...fields,
  type: fields.type.default("OTHER"),
  priority: fields.priority.default("MEDIUM"),
  dueDate: fields.dueDate.optional(),
  timezone: timezone.default("UTC"),
  status: editableStatus.default("TODO"),
  repeatPattern: fields.repeatPattern.default("NONE"),
}).superRefine((value, ctx) => {
  if (value.repeatPattern !== "NONE" && !value.dueDate) {
    ctx.addIssue({ code: "custom", path: ["dueDate"], message: "A repeating task requires dueDate" });
  }
});

export const updateTaskSchema = z.strictObject(fields).partial().refine(
  (value) => Object.values(value).some((field) => field !== undefined), "At least one task field is required",
);

export const completeTaskSchema = z.strictObject({}).optional();
export const taskIdSchema = z.uuid();
const pagination = z.strictObject({
  page: z.coerce.number().int().positive().max(1_000_000).optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const taskListQuerySchema = pagination.extend({
  type: taskTypeSchema.optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  repeatPattern: taskRepeatPatternSchema.optional(),
  dueDateFrom: timestamp.optional(),
  dueDateTo: timestamp.optional(),
  search: z.string().trim().max(200).optional(),
  sortBy: z.enum(["dueDate", "priority", "title", "createdAt", "updatedAt"]).default("dueDate"),
  order: z.enum(["asc", "desc"]).default("asc"),
}).refine((value) => !value.dueDateFrom || !value.dueDateTo || value.dueDateFrom <= value.dueDateTo, {
  path: ["dueDateTo"], message: "dueDateTo must be on or after dueDateFrom",
});

export const todayTasksQuerySchema = pagination.extend({ timezone: timezone.default("UTC") });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
export type TodayTasksQuery = z.infer<typeof todayTasksQuerySchema>;
