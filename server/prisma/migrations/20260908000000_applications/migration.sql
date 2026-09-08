CREATE TYPE "ApplicationStage" AS ENUM ('WISHLIST', 'APPLIED', 'HR', 'TECHNICAL', 'ASSIGNMENT', 'FINAL', 'OFFER', 'REJECTED', 'ARCHIVED');

CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "dateApplied" TIMESTAMP(3),
    "salary" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "recruiter" TEXT,
    "stage" "ApplicationStage" NOT NULL DEFAULT 'WISHLIST',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationStageHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStage" "ApplicationStage",
    "toStage" "ApplicationStage" NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationStageHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Application_userId_deletedAt_idx" ON "Application"("userId", "deletedAt");
CREATE INDEX "Application_userId_companyId_idx" ON "Application"("userId", "companyId");
CREATE INDEX "Application_userId_stage_idx" ON "Application"("userId", "stage");
CREATE INDEX "Application_userId_dateApplied_idx" ON "Application"("userId", "dateApplied");
CREATE INDEX "Application_companyId_idx" ON "Application"("companyId");
CREATE INDEX "Application_recruiter_idx" ON "Application"("recruiter");
CREATE INDEX "ApplicationStageHistory_applicationId_createdAt_id_idx" ON "ApplicationStageHistory"("applicationId", "createdAt", "id");
CREATE INDEX "ApplicationStageHistory_changedById_idx" ON "ApplicationStageHistory"("changedById");

ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_recruiter_fkey" FOREIGN KEY ("recruiter") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApplicationStageHistory" ADD CONSTRAINT "ApplicationStageHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationStageHistory" ADD CONSTRAINT "ApplicationStageHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
