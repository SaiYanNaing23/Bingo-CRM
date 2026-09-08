import type { HealthResponse } from "./types/health.types";

export const getHealth = async (): Promise<HealthResponse> => ({
  status: "ok",
  uptimeSeconds: Math.floor(process.uptime()),
  timestamp: new Date().toISOString(),
});
