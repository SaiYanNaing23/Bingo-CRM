import "dotenv/config";
import type { Server } from "node:http";

import { app } from "./app";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { env } from "./config/env";

const server: Server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Server started");
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Shutting down gracefully");
  server.close(() => {
    logger.info("HTTP server closed");
  });
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
