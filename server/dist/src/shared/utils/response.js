"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, statusCode = 200) => {
    const payload = {
        success: true,
        data,
    };
    res.status(statusCode).json(payload);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 500, details, code = "INTERNAL_ERROR") => {
    const payload = {
        success: false,
        error: message,
        code,
        ...(details ? { details } : {}),
    };
    res.status(statusCode).json(payload);
};
exports.sendError = sendError;
const sendPaginated = (res, data, meta, statusCode = 200) => {
    const payload = {
        success: true,
        data,
        meta,
    };
    res.status(statusCode).json(payload);
};
exports.sendPaginated = sendPaginated;
//# sourceMappingURL=response.js.map