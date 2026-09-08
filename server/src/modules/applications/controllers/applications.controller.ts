import type { Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { sendPaginated, sendSuccess } from "../../../shared/utils/response";
import * as service from "../services/applications.service";
import * as validate from "../validators/applications.validators";

const userId = (req: Request): string => {
  if (!req.user) throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  return req.user.id;
};
const applicationId = (req: Request) => validate.validateApplicationId(req.params.id);

export const createApplicationController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.createApplication(validate.validateCreateApplication(req.body), userId(req)), 201);
};

export const listApplicationsController = async (req: Request, res: Response) => {
  const result = await service.listApplications(validate.validateApplicationListQuery(req.query), userId(req));
  sendPaginated(res, result.data, result.meta);
};

export const getApplicationController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.getApplication(applicationId(req), userId(req)));
};

export const updateApplicationController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.updateApplication(applicationId(req), validate.validateUpdateApplication(req.body), userId(req)));
};

export const deleteApplicationController = async (req: Request, res: Response) => {
  await service.deleteApplication(applicationId(req), userId(req));
  sendSuccess(res, { message: "Application deleted" });
};

export const transitionApplicationStageController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.transitionApplicationStage(applicationId(req), validate.validateApplicationStageUpdate(req.body), userId(req)));
};

export const listApplicationStageHistoryController = async (req: Request, res: Response) => {
  const result = await service.listApplicationStageHistory(applicationId(req), validate.validateApplicationHistoryQuery(req.query), userId(req));
  sendPaginated(res, result.data, result.meta);
};
