import { z } from "zod";
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_URL: z.ZodString;
    JWT_SECRET: z.ZodDefault<z.ZodString>;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<{
        error: "error";
        fatal: "fatal";
        warn: "warn";
        info: "info";
        debug: "debug";
        trace: "trace";
    }>>;
    BCRYPT_SALT_ROUNDS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    RATE_LIMIT_WINDOW_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    RATE_LIMIT_MAX: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    PAGINATION_DEFAULT_LIMIT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    PAGINATION_MAX_LIMIT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    SEED_ADMIN_EMAIL: z.ZodDefault<z.ZodString>;
    SEED_ADMIN_NAME: z.ZodDefault<z.ZodString>;
    SEED_ADMIN_PASSWORD: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const env: {
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: number;
    CORS_ORIGIN: string;
    LOG_LEVEL: "error" | "fatal" | "warn" | "info" | "debug" | "trace";
    BCRYPT_SALT_ROUNDS: number;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX: number;
    PAGINATION_DEFAULT_LIMIT: number;
    PAGINATION_MAX_LIMIT: number;
    SEED_ADMIN_EMAIL: string;
    SEED_ADMIN_NAME: string;
    SEED_ADMIN_PASSWORD: string;
};
export type AppEnv = z.infer<typeof envSchema>;
export {};
//# sourceMappingURL=env.d.ts.map