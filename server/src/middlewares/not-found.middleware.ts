import type { Request, Response } from "express";
import { sendError } from "../shared/utils/response";

export const notFoundHandler = (req: Request, res: Response) => {
  sendError(res, "Not Found", 404, { path: req.originalUrl }, "NOT_FOUND");
};
