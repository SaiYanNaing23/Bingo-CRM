export type HealthStatus = "ok";

export type HealthResponse = {
  status: HealthStatus;
  uptimeSeconds: number;
  timestamp: string;
};
