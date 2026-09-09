import type { Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { sendPaginated, sendSuccess } from "../../../shared/utils/response";
import * as service from "../services/projects.service";
import * as validate from "../validators/projects.validators";

const userId = (req: Request): string => {
  if (!req.user) throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  return req.user.id;
};
const projectId = (req: Request) => validate.validateProjectId(req.params.id);

export const createProjectController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.createProject(validate.validateCreateProject(req.body), userId(req)), 201);
};
export const listProjectsController = async (req: Request, res: Response) => {
  const result = await service.listProjects(validate.validateProjectListQuery(req.query), userId(req));
  sendPaginated(res, result.data, result.meta);
};
export const getProjectController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.getProject(projectId(req), userId(req)));
};
export const updateProjectController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.updateProject(projectId(req), validate.validateUpdateProject(req.body), userId(req)));
};
export const deleteProjectController = async (req: Request, res: Response) => {
  const id = projectId(req);
  await service.deleteProject(id, userId(req));
  sendSuccess(res, { id, deleted: true });
};
export const updateProjectProgressController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.updateProjectProgress(projectId(req), validate.validateProjectProgress(req.body), userId(req)));
};
export const createProjectCommentController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.createProjectComment(projectId(req), validate.validateProjectComment(req.body), userId(req)), 201);
};
export const listProjectActivitiesController = async (req: Request, res: Response) => {
  const result = await service.listProjectActivities(projectId(req), validate.validateProjectActivityQuery(req.query), userId(req));
  sendPaginated(res, result.data, result.meta);
};
