"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const env_1 = require("../config/env");
const app_error_1 = require("../shared/errors/app-error");
const prisma_1 = require("../lib/prisma");
const soft_delete_1 = require("../shared/utils/soft-delete");
const authMiddleware = async (req, _res, next) => {
    const authHeader = req.header("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return next(new app_error_1.AppError("Authorization header missing", 401, undefined, "AUTH_MISSING_TOKEN"));
    }
    const token = authHeader.substring("Bearer ".length).trim();
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        if (typeof payload === "string") {
            next(new app_error_1.AppError("Invalid token payload", 401, undefined, "AUTH_INVALID_PAYLOAD"));
            return;
        }
        if (!payload?.sub || typeof payload.sub !== "string") {
            next(new app_error_1.AppError("Invalid token payload", 401, undefined, "AUTH_INVALID_PAYLOAD"));
            return;
        }
        if (typeof payload.email !== "string" || !payload.role) {
            next(new app_error_1.AppError("Invalid token payload", 401, undefined, "AUTH_INVALID_PAYLOAD"));
            return;
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: (0, soft_delete_1.withActiveRecordFilter)({ id: payload.sub, email: payload.email }),
            select: {
                id: true,
                email: true,
                role: true,
            },
        });
        if (!user) {
            next(new app_error_1.AppError("Invalid token payload", 401, undefined, "AUTH_INVALID_PAYLOAD"));
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            next(new app_error_1.AppError("Invalid token", 401, { reason: error.message }, "AUTH_INVALID_TOKEN"));
            return;
        }
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.middleware.js.map