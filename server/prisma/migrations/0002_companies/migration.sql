CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE "Company" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "logo" TEXT,
  "name" TEXT NOT NULL,
  "country" TEXT,
  "industry" TEXT,
  "website" TEXT,
  "linkedIn" TEXT,
  "careerPage" TEXT,
  "techStack" TEXT[],
  "size" INTEGER,
  "salaryRange" TEXT,
  "remote" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Company_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Company_userId_idx" ON "Company"("userId");
CREATE INDEX "Company_userId_deletedAt_idx" ON "Company"("userId", "deletedAt");
CREATE INDEX "Company_status_idx" ON "Company"("status");
CREATE INDEX "Company_country_idx" ON "Company"("country");
