"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const zod_1 = require("zod");
const app_error_1 = require("../shared/errors/app-error");
const logger_1 = require("../lib/logger");
const response_1 = require("../shared/utils/response");
const errorMiddleware = (err, _req, res, _next) => {
    if (err?.type === "entity.too.large") {
        (0, response_1.sendError)(res, "Request body exceeds the 1 MB limit", 413, undefined, "PAYLOAD_TOO_LARGE");
        return;
    }
    if (err instanceof SyntaxError &&
        "type" in err &&
        err.type === "entity.parse.failed") {
        logger_1.logger.warn({ err }, "Payload parse error");
        (0, response_1.sendError)(res, "Validation failed", 400, { message: "Invalid JSON payload" }, "VALIDATION_ERROR");
        return;
    }
    if (err instanceof app_error_1.AppError) {
        logger_1.logger.error({ err }, "Application error");
        (0, response_1.sendError)(res, err.message, err.statusCode, err.details, err.code);
        return;
    }
    if (err instanceof zod_1.ZodError) {
        logger_1.logger.warn({ err }, "Validation error");
        (0, response_1.sendError)(res, "Validation failed", 400, err.flatten(), "VALIDATION_ERROR");
        return;
    }
    logger_1.logger.error({ err }, "Unexpected request error");
    (0, response_1.sendError)(res, "An unexpected error occurred", 500, undefined, "INTERNAL_ERROR");
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map