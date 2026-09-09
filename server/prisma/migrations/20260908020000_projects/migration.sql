CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "ProjectActivityType" AS ENUM ('CREATED', 'PROGRESS_UPDATE', 'COMMENT');

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "githubUrl" TEXT,
  "liveDemoUrl" TEXT,
  "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "stack" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "screenshots" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "lessonsLearned" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Project_progress_check" CHECK ("progress" BETWEEN 0 AND 100),
  CONSTRAINT "Project_status_progress_check" CHECK (
    ("status" = 'PLANNED' AND "progress" = 0) OR
    ("status" IN ('IN_PROGRESS', 'ON_HOLD') AND "progress" BETWEEN 0 AND 99) OR
    ("status" = 'COMPLETED' AND "progress" = 100) OR
    "status" = 'ARCHIVED'
  )
);

CREATE TABLE "ProjectActivity" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "type" "ProjectActivityType" NOT NULL,
  "fromStatus" "ProjectStatus",
  "toStatus" "ProjectStatus",
  "fromProgress" INTEGER,
  "toProgress" INTEGER,
  "content" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProjectActivity_progress_check" CHECK (
    ("fromProgress" IS NULL OR "fromProgress" BETWEEN 0 AND 100) AND
    ("toProgress" IS NULL OR "toProgress" BETWEEN 0 AND 100)
  ),
  CONSTRAINT "ProjectActivity_shape_check" CHECK (
    ("type" = 'CREATED' AND "fromStatus" IS NULL AND "fromProgress" IS NULL
      AND "toStatus" IS NOT NULL AND "toProgress" IS NOT NULL AND "content" IS NULL) OR
    ("type" = 'PROGRESS_UPDATE' AND "fromStatus" IS NOT NULL AND "fromProgress" IS NOT NULL
      AND "toStatus" IS NOT NULL AND "toProgress" IS NOT NULL
      AND ("fromStatus" <> "toStatus" OR "fromProgress" <> "toProgress")) OR
    ("type" = 'COMMENT' AND "fromStatus" IS NULL AND "fromProgress" IS NULL
      AND "toStatus" IS NULL AND "toProgress" IS NULL AND "content" IS NOT NULL
      AND LENGTH(BTRIM("content")) > 0)
  )
);

CREATE INDEX "Project_userId_deletedAt_idx" ON "Project"("userId", "deletedAt");
CREATE INDEX "Project_userId_status_idx" ON "Project"("userId", "status");
CREATE INDEX "Project_userId_updatedAt_idx" ON "Project"("userId", "updatedAt");
CREATE INDEX "Project_stack_idx" ON "Project" USING GIN ("stack");
CREATE INDEX "ProjectActivity_projectId_createdAt_id_idx" ON "ProjectActivity"("projectId", "createdAt", "id");
CREATE INDEX "ProjectActivity_createdById_idx" ON "ProjectActivity"("createdById");

ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
