"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const logger_1 = require("./lib/logger");
const prisma_1 = require("./lib/prisma");
const env_1 = require("./config/env");
const server = app_1.app.listen(env_1.env.PORT, () => {
    logger_1.logger.info({ port: env_1.env.PORT }, "Server started");
});
const shutdown = async (signal) => {
    logger_1.logger.info({ signal }, "Shutting down gracefully");
    server.close(() => {
        logger_1.logger.info("HTTP server closed");
    });
    await prisma_1.prisma.$disconnect();
    process.exit(0);
};
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
//# sourceMappingURL=server.js.map