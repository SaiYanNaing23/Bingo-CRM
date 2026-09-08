require("dotenv/config");
const { PrismaClient } = require("../src/generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  log: ["error"],
});

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@devtrack.local").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "DevTrackAdmin123!";
  const fullName = process.env.SEED_ADMIN_NAME ?? "DevTrack Admin";

  const passwordHash = await bcrypt.hash(
    password,
    Number(process.env.BCRYPT_SALT_ROUNDS ?? 12)
  );

  await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      passwordHash,
      role: "ADMIN",
      deletedAt: null,
    },
    create: {
      email,
      fullName,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.info("Seed user ready:", email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
