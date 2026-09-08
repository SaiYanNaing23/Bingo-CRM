import { PrismaClient } from "../generated/prisma/client";
import type { PrismaClient as PrismaClientType } from "../generated/prisma/client";
declare global {
    var __prisma: PrismaClientType | undefined;
}
declare const prisma: PrismaClient<import("../generated/prisma").Prisma.PrismaClientOptions, never, import("../generated/prisma/runtime/client").DefaultArgs>;
export { prisma };
//# sourceMappingURL=prisma.d.ts.map