import type { Request, Response } from "express";

import { AppError } from "../../../shared/errors/app-error";
import { sendSuccess } from "../../../shared/utils/response";
import { sendPaginated } from "../../../shared/utils/response";
import {
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  transitionCompanyStatus,
  updateCompany,
} from "../services/companies.service";
import {
  validateCompanyListQuery,
  validateCompanyStatusTransition,
  validateCreateCompany,
  validateUpdateCompany,
} from "../validators/companies.validators";

export const createCompanyController = async (req: Request, res: Response) => {
  const payload = validateCreateCompany(req.body);
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  }
  const result = await createCompany(payload, userId);

  sendSuccess(res, result, 201);
};

export const listCompaniesController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  }

  const query = validateCompanyListQuery(req.query);
  const result = await listCompanies(query, userId);

  sendPaginated(res, result.data, result.meta);
};

export const getCompanyController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  }
  const id = typeof req.params.id === "string" ? req.params.id : "";

  const result = await getCompany(id, userId);

  sendSuccess(res, result);
};

export const updateCompanyController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  }
  const id = typeof req.params.id === "string" ? req.params.id : "";
  const payload = validateUpdateCompany(req.body);

  const result = await updateCompany(id, payload, userId);

  sendSuccess(res, result);
};

export const deleteCompanyController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  }
  const id = typeof req.params.id === "string" ? req.params.id : "";

  await deleteCompany(id, userId);

  sendSuccess(res, { message: "Company deleted" });
};

export const transitionCompanyStatusController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  }
  const id = typeof req.params.id === "string" ? req.params.id : "";
  const payload = validateCompanyStatusTransition(req.body);

  const result = await transitionCompanyStatus(id, payload, userId);

  sendSuccess(res, result);
};
