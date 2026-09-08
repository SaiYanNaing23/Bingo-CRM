"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayTasksController = exports.completeTaskController = exports.deleteTaskController = exports.updateTaskController = exports.getTaskController = exports.listTasksController = exports.createTaskController = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const response_1 = require("../../../shared/utils/response");
const service = __importStar(require("../services/tasks.service"));
const validate = __importStar(require("../validators/tasks.validators"));
const userId = (req) => {
    if (!req.user)
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    return req.user.id;
};
const taskId = (req) => validate.validateTaskId(req.params.id);
const createTaskController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.createTask(validate.validateCreateTask(req.body), userId(req)), 201);
};
exports.createTaskController = createTaskController;
const listTasksController = async (req, res) => {
    const result = await service.listTasks(validate.validateTaskListQuery(req.query), userId(req));
    (0, response_1.sendPaginated)(res, result.data, result.meta);
};
exports.listTasksController = listTasksController;
const getTaskController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.getTask(taskId(req), userId(req)));
};
exports.getTaskController = getTaskController;
const updateTaskController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.updateTask(taskId(req), validate.validateUpdateTask(req.body), userId(req)));
};
exports.updateTaskController = updateTaskController;
const deleteTaskController = async (req, res) => {
    await service.deleteTask(taskId(req), userId(req));
    (0, response_1.sendSuccess)(res, { message: "Task deleted" });
};
exports.deleteTaskController = deleteTaskController;
const completeTaskController = async (req, res) => {
    validate.validateCompleteTask(req.body);
    (0, response_1.sendSuccess)(res, await service.completeTask(taskId(req), userId(req)));
};
exports.completeTaskController = completeTaskController;
const getTodayTasksController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.getTodayTasks(validate.validateTodayTasksQuery(req.query), userId(req)));
};
exports.getTodayTasksController = getTodayTasksController;
//# sourceMappingURL=tasks.controller.js.map