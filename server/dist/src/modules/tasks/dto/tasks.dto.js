"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.todayTasksQuerySchema = exports.taskListQuerySchema = exports.taskIdSchema = exports.completeTaskSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.taskRepeatPatternSchema = exports.taskStatusSchema = exports.taskPrioritySchema = exports.taskTypeSchema = void 0;
const zod_1 = require("zod");
exports.taskTypeSchema = zod_1.z.enum(["JOB_APPLICATION", "FOLLOW_UP", "INTERVIEW", "LEARNING", "PROJECT", "OTHER"]);
exports.taskPrioritySchema = zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
exports.taskStatusSchema = zod_1.z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
exports.taskRepeatPatternSchema = zod_1.z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]);
const editableStatus = zod_1.z.enum(["TODO", "IN_PROGRESS", "CANCELLED"]);
const timestamp = zod_1.z.iso.datetime({ offset: true }).pipe(zod_1.z.coerce.date());
const timezone = zod_1.z.string().trim().min(1).max(100).refine((value) => {
    if (/^[+-]/.test(value))
        return false;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: value });
        return true;
    }
    catch {
        return false;
    }
}, "Invalid timezone; use a named timezone such as Asia/Yangon or UTC");
const fields = {
    title: zod_1.z.string().trim().min(2).max(200),
    type: exports.taskTypeSchema,
    priority: exports.taskPrioritySchema,
    dueDate: timestamp.nullable(),
    timezone,
    status: editableStatus,
    repeatPattern: exports.taskRepeatPatternSchema,
};
exports.createTaskSchema = zod_1.z.strictObject({
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
exports.updateTaskSchema = zod_1.z.strictObject(fields).partial().refine((value) => Object.values(value).some((field) => field !== undefined), "At least one task field is required");
exports.completeTaskSchema = zod_1.z.strictObject({}).optional();
exports.taskIdSchema = zod_1.z.uuid();
const pagination = zod_1.z.strictObject({
    page: zod_1.z.coerce.number().int().positive().max(1_000_000).optional(),
    limit: zod_1.z.coerce.number().int().positive().optional(),
});
exports.taskListQuerySchema = pagination.extend({
    type: exports.taskTypeSchema.optional(),
    priority: exports.taskPrioritySchema.optional(),
    status: exports.taskStatusSchema.optional(),
    repeatPattern: exports.taskRepeatPatternSchema.optional(),
    dueDateFrom: timestamp.optional(),
    dueDateTo: timestamp.optional(),
    search: zod_1.z.string().trim().max(200).optional(),
    sortBy: zod_1.z.enum(["dueDate", "priority", "title", "createdAt", "updatedAt"]).default("dueDate"),
    order: zod_1.z.enum(["asc", "desc"]).default("asc"),
}).refine((value) => !value.dueDateFrom || !value.dueDateTo || value.dueDateFrom <= value.dueDateTo, {
    path: ["dueDateTo"], message: "dueDateTo must be on or after dueDateFrom",
});
exports.todayTasksQuerySchema = pagination.extend({ timezone: timezone.default("UTC") });
//# sourceMappingURL=tasks.dto.js.map