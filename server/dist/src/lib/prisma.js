"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("../generated/prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const env_1 = require("../config/env");
const PrismaClientFactory = client_1.PrismaClient;
const adapter = new adapter_pg_1.PrismaPg({ connectionString: env_1.env.DATABASE_URL });
const createPrismaClient = () => new PrismaClientFactory({
    adapter,
    log: env_1.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
});
const hasCurrentDelegates = (client) => Boolean(client?.company && client.contact && client.application && client.applicationStageHistory && client.task);
const existingClient = global.__prisma;
const needsNewClient = process.env.NODE_ENV !== "production" ? !hasCurrentDelegates(existingClient) : false;
const prisma = needsNewClient ? createPrismaClient() : existingClient ?? createPrismaClient();
exports.prisma = prisma;
if (process.env.NODE_ENV !== "production") {
    global.__prisma = prisma;
}
//# sourceMappingURL=prisma.js.map