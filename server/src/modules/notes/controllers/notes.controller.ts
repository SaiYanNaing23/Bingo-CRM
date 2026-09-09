import type { Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { sendPaginated, sendSuccess } from "../../../shared/utils/response";
import * as service from "../services/notes.service";
import * as validate from "../validators/notes.validators";

const userId = (req: Request): string => {
  if (!req.user) throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  return req.user.id;
};
const noteId = (req: Request) => validate.validateNoteId(req.params.id);

export const createNoteController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.createNote(validate.validateCreateNote(req.body), userId(req)), 201);
};
export const listNotesController = async (req: Request, res: Response) => {
  const result = await service.listNotes(validate.validateNoteListQuery(req.query), userId(req));
  sendPaginated(res, result.data, result.meta);
};
export const getNoteController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.getNote(noteId(req), userId(req)));
};
export const updateNoteController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.updateNote(noteId(req), validate.validateUpdateNote(req.body), userId(req)));
};
export const deleteNoteController = async (req: Request, res: Response) => {
  const id = noteId(req);
  await service.deleteNote(id, userId(req));
  sendSuccess(res, { id, deleted: true });
};
