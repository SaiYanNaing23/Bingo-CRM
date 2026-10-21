import type { Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { sendPaginated, sendSuccess } from "../../../shared/utils/response";
import * as service from "../services/documents.service";
import * as validate from "../validators/documents.validators";

const userId = (req: Request): string => {
  if (!req.user) throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  return req.user.id;
};

const documentId = (req: Request): string => validate.validateDocumentId(req.params.id);
const versionId = (req: Request): string => validate.validateVersionId(req.params.versionId);

export const createDocumentController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.createDocument(validate.validateCreateDocument(req.body), userId(req)), 201);
};

export const listDocumentsController = async (req: Request, res: Response) => {
  const result = await service.listDocuments(validate.validateDocumentListQuery(req.query), userId(req));
  sendPaginated(res, result.data, result.meta);
};

export const getDocumentController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.getDocument(documentId(req), userId(req)));
};

export const updateDocumentController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.updateDocument(documentId(req), validate.validateUpdateDocument(req.body), userId(req)));
};

export const deleteDocumentController = async (req: Request, res: Response) => {
  const id = documentId(req);
  await service.deleteDocument(id, userId(req));
  sendSuccess(res, { id, deleted: true });
};

export const addDocumentVersionController = async (req: Request, res: Response) => {
  sendSuccess(
    res,
    await service.addDocumentVersion(documentId(req), validate.validateCreateDocumentVersion(req.body), userId(req)),
    201,
  );
};

export const listDocumentVersionsController = async (req: Request, res: Response) => {
  const result = await service.listDocumentVersions(documentId(req), validate.validateVersionListQuery(req.query), userId(req));
  sendPaginated(res, result.data, result.meta);
};

export const deleteDocumentVersionController = async (req: Request, res: Response) => {
  const vId = versionId(req);
  await service.deleteDocumentVersion(documentId(req), vId, userId(req));
  sendSuccess(res, { id: vId, deleted: true });
};

