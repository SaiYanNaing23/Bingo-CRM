import type { Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { sendPaginated, sendSuccess } from "../../../shared/utils/response";
import * as service from "../services/tasks.service";
import * as validate from "../validators/tasks.validators";

const userId = (req: Request): string => {
  if (!req.user) throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  return req.user.id;
};
const taskId = (req: Request) => validate.validateTaskId(req.params.id);

export const createTaskController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.createTask(validate.validateCreateTask(req.body), userId(req)), 201);
};
export const listTasksController = async (req: Request, res: Response) => {
  const result = await service.listTasks(validate.validateTaskListQuery(req.query), userId(req));
  sendPaginated(res, result.data, result.meta);
};
export const getTaskController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.getTask(taskId(req), userId(req)));
};
export const updateTaskController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.updateTask(taskId(req), validate.validateUpdateTask(req.body), userId(req)));
};
export const deleteTaskController = async (req: Request, res: Response) => {
  await service.deleteTask(taskId(req), userId(req));
  sendSuccess(res, { message: "Task deleted" });
};
export const completeTaskController = async (req: Request, res: Response) => {
  validate.validateCompleteTask(req.body);
  sendSuccess(res, await service.completeTask(taskId(req), userId(req)));
};
export const getTodayTasksController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.getTodayTasks(validate.validateTodayTasksQuery(req.query), userId(req)));
};
