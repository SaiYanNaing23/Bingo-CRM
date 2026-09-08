import type { Request, Response } from "express";

import { AppError } from "../../../shared/errors/app-error";
import { sendPaginated, sendSuccess } from "../../../shared/utils/response";
import {
  createContact,
  deleteContact,
  getContact,
  listContacts,
  updateContact,
  updateContactFollowUp,
} from "../services/contacts.service";
import {
  validateContactFollowUpUpdate,
  validateContactListQuery,
  validateCreateContact,
  validateUpdateContact,
} from "../validators/contacts.validators";

export const createContactController = async (req: Request, res: Response) => {
  const payload = validateCreateContact(req.body);
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  }

  const result = await createContact(payload, userId);

  sendSuccess(res, result, 201);
};

export const listContactsController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  }

  const query = validateContactListQuery(req.query);
  const result = await listContacts(query, userId);

  sendPaginated(res, result.data, result.meta);
};

export const getContactController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  }

  const id = typeof req.params.id === "string" ? req.params.id : "";
  const result = await getContact(id, userId);

  sendSuccess(res, result);
};

export const updateContactController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  }

  const id = typeof req.params.id === "string" ? req.params.id : "";
  const payload = validateUpdateContact(req.body);

  const result = await updateContact(id, payload, userId);

  sendSuccess(res, result);
};

export const deleteContactController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  }

  const id = typeof req.params.id === "string" ? req.params.id : "";
  await deleteContact(id, userId);

  sendSuccess(res, { message: "Contact deleted" });
};

export const updateContactFollowUpController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  }

  const id = typeof req.params.id === "string" ? req.params.id : "";
  const payload = validateContactFollowUpUpdate(req.body);

  const result = await updateContactFollowUp(id, payload, userId);

  sendSuccess(res, result);
};
