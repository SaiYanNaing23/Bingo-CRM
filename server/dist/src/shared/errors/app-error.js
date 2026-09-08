"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    details;
    code;
    constructor(message, statusCode = 500, details, code) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.code = code ?? "APP_ERROR";
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=app-error.js.map