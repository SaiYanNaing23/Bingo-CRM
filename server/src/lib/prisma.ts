import { PrismaClient } from "../generated/prisma/client";
import type { PrismaClient as PrismaClientType } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "../config/env";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClientType | undefined;
}

type PrismaClientConstructor = new (opts?: unknown) => PrismaClientType;
const PrismaClientFactory = PrismaClient as unknown as PrismaClientConstructor;
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const createPrismaClient = (): PrismaClientType =>
  new PrismaClientFactory({
    adapter,
    log: env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });

const hasCurrentDelegates = (client: PrismaClientType | undefined): boolean =>
  Boolean(client?.company && client.contact && client.application && client.applicationStageHistory && client.task);

const existingClient = global.__prisma;
const needsNewClient = process.env.NODE_ENV !== "production" ? !hasCurrentDelegates(existingClient) : false;
const prisma = needsNewClient ? createPrismaClient() : existingClient ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export { prisma };
