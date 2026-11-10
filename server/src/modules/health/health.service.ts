import type { HealthResponse } from "./types/health.types";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";

export const getHealth = async (): Promise<HealthResponse> => ({
  status: "ok",
  uptimeSeconds: Math.floor(process.uptime()),
  timestamp: new Date().toISOString(),
});

// Share a pending database probe so concurrent visitors do not queue extra queries.
let databaseCheck: Promise<unknown> | undefined;

export const getReadiness = async (): Promise<HealthResponse> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    databaseCheck ??= prisma.$queryRaw`SELECT 1`.finally(() => {
      databaseCheck = undefined;
    });
    await Promise.race([
      databaseCheck,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Readiness timed out")), 10_000);
      }),
    ]);
    return getHealth();
  } catch {
    throw new AppError("The server is not ready yet", 503, undefined, "SERVER_NOT_READY");
  } finally {
    clearTimeout(timeout);
  }
};
