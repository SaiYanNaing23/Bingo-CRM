import type { Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { sendPaginated, sendSuccess } from "../../../shared/utils/response";
import * as service from "../services/calendar.service";
import * as validate from "../validators/calendar.validators";

const userId = (req: Request) => {
  if (!req.user) throw new AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
  return req.user.id;
};
const eventId = (req: Request) => validate.validateCalendarEventId(req.params.id);
export const createCalendarEventController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.createCalendarEvent(validate.validateCreateCalendarEvent(req.body), userId(req)), 201);
};
export const listCalendarEventsController = async (req: Request, res: Response) => {
  const result = await service.listCalendarEvents(validate.validateCalendarEventList(req.query), userId(req));
  sendPaginated(res, result.data, result.meta);
};
export const getCalendarEventController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.getCalendarEvent(eventId(req), userId(req)));
};
export const updateCalendarEventController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.updateCalendarEvent(eventId(req), validate.validateUpdateCalendarEvent(req.body), userId(req)));
};
export const deleteCalendarEventController = async (req: Request, res: Response) => {
  const id = eventId(req);
  await service.deleteCalendarEvent(id, userId(req));
  sendSuccess(res, { id, deleted: true });
};
export const getCalendarRangeController = async (req: Request, res: Response) => {
  sendSuccess(res, await service.getCalendarRange(validate.validateCalendarRange(req.query), userId(req)));
};
export const listCalendarRemindersController = async (req: Request, res: Response) => {
  const result = await service.listCalendarReminders(validate.validateCalendarReminders(req.query), userId(req));
  sendPaginated(res, result.data, result.meta);
};
