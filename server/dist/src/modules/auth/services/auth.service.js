"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../../config/env");
const app_error_1 = require("../../../shared/errors/app-error");
const prisma_1 = require("../../../lib/prisma");
const soft_delete_1 = require("../../../shared/utils/soft-delete");
const mapUser = (user) => ({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
const signToken = (user) => {
    const options = {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    };
    return jsonwebtoken_1.default.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
    }, env_1.env.JWT_SECRET, options);
};
const register = async (input) => {
    const email = input.email.toLowerCase();
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        throw new app_error_1.AppError("Email already in use", 409, "Email must be unique", "AUTH_DUPLICATE");
    }
    const passwordHash = await bcrypt_1.default.hash(input.password, env_1.env.BCRYPT_SALT_ROUNDS);
    const userRecord = await prisma_1.prisma.user.create({
        data: {
            email,
            fullName: input.fullName,
            passwordHash,
            role: "USER",
        },
    });
    const user = mapUser(userRecord);
    const token = signToken(user);
    return { user, token };
};
exports.register = register;
const login = async (input) => {
    const email = input.email.toLowerCase();
    const userRecord = await prisma_1.prisma.user.findFirst({
        where: (0, soft_delete_1.withActiveRecordFilter)({ email }),
    });
    if (!userRecord) {
        throw new app_error_1.AppError("Invalid email or password", 401, undefined, "AUTH_INVALID_CREDENTIALS");
    }
    const passwordMatch = await bcrypt_1.default.compare(input.password, userRecord.passwordHash);
    if (!passwordMatch) {
        throw new app_error_1.AppError("Invalid email or password", 401, undefined, "AUTH_INVALID_CREDENTIALS");
    }
    const user = mapUser(userRecord);
    const token = signToken(user);
    return { user, token };
};
exports.login = login;
//# sourceMappingURL=auth.service.js.map