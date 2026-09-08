"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(2, "fullName must be at least 2 characters"),
    email: zod_1.z.email("A valid email is required"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters"),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.email("A valid email is required"),
    password: zod_1.z.string().min(1, "Password is required"),
});
//# sourceMappingURL=auth.dto.js.map