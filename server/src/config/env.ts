import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().default("dev-jwt-secret"),
  JWT_EXPIRES_IN: z.coerce.number().int().positive().default(900),
  CORS_ORIGIN: z.string().default("*"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(16).default(12),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  PAGINATION_DEFAULT_LIMIT: z.coerce.number().int().positive().default(20),
  PAGINATION_MAX_LIMIT: z.coerce.number().int().positive().default(100),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@devtrack.local"),
  SEED_ADMIN_NAME: z.string().default("DevTrack Admin"),
  SEED_ADMIN_PASSWORD: z.string().min(8).default("DevTrackAdmin123!"),
  UPLOADTHING_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type AppEnv = z.infer<typeof envSchema>;
