import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { AppError } from "../shared/errors/app-error";
import { logger } from "../lib/logger";
import { sendError } from "../shared/utils/response";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err?.type === "entity.too.large") {
    sendError(res, "Request body exceeds the 1 MB limit", 413, undefined, "PAYLOAD_TOO_LARGE");
    return;
  }

  if (
    err instanceof SyntaxError &&
    "type" in err &&
    err.type === "entity.parse.failed"
  ) {
    logger.warn({ err }, "Payload parse error");
    sendError(res, "Validation failed", 400, { message: "Invalid JSON payload" }, "VALIDATION_ERROR");
    return;
  }

  if (err instanceof AppError) {
    logger.error({ err }, "Application error");
    sendError(res, err.message, err.statusCode, err.details, err.code);
    return;
  }

  if (err instanceof ZodError) {
    logger.warn({ err }, "Validation error");
    sendError(res, "Validation failed", 400, err.flatten(), "VALIDATION_ERROR");
    return;
  }

  logger.error({ err }, "Unexpected request error");
  sendError(res, "An unexpected error occurred", 500, undefined, "INTERNAL_ERROR");
};
