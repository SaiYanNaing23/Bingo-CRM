"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTodayTasksQuery = exports.validateTaskListQuery = exports.validateTaskId = exports.validateCompleteTask = exports.validateUpdateTask = exports.validateCreateTask = void 0;
const tasks_dto_1 = require("../dto/tasks.dto");
const validateCreateTask = (input) => tasks_dto_1.createTaskSchema.parse(input);
exports.validateCreateTask = validateCreateTask;
const validateUpdateTask = (input) => tasks_dto_1.updateTaskSchema.parse(input);
exports.validateUpdateTask = validateUpdateTask;
const validateCompleteTask = (input) => tasks_dto_1.completeTaskSchema.parse(input);
exports.validateCompleteTask = validateCompleteTask;
const validateTaskId = (input) => tasks_dto_1.taskIdSchema.parse(input);
exports.validateTaskId = validateTaskId;
const validateTaskListQuery = (input) => tasks_dto_1.taskListQuerySchema.parse(input);
exports.validateTaskListQuery = validateTaskListQuery;
const validateTodayTasksQuery = (input) => tasks_dto_1.todayTasksQuerySchema.parse(input);
exports.validateTodayTasksQuery = validateTodayTasksQuery;
//# sourceMappingURL=tasks.validators.js.map