"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().int().positive().max(65535).default(4000),
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().default("dev-jwt-secret"),
    JWT_EXPIRES_IN: zod_1.z.coerce.number().int().positive().default(900),
    CORS_ORIGIN: zod_1.z.string().default("*"),
    LOG_LEVEL: zod_1.z
        .enum(["fatal", "error", "warn", "info", "debug", "trace"])
        .default("info"),
    BCRYPT_SALT_ROUNDS: zod_1.z.coerce.number().int().min(8).max(16).default(12),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().positive().default(900_000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().int().positive().default(100),
    PAGINATION_DEFAULT_LIMIT: zod_1.z.coerce.number().int().positive().default(20),
    PAGINATION_MAX_LIMIT: zod_1.z.coerce.number().int().positive().default(100),
    SEED_ADMIN_EMAIL: zod_1.z.string().email().default("admin@devtrack.local"),
    SEED_ADMIN_NAME: zod_1.z.string().default("DevTrack Admin"),
    SEED_ADMIN_PASSWORD: zod_1.z.string().min(8).default("DevTrackAdmin123!"),
});
exports.env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map