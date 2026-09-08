CREATE TYPE "TaskType" AS ENUM ('JOB_APPLICATION', 'FOLLOW_UP', 'INTERVIEW', 'LEARNING', 'PROJECT', 'OTHER');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "TaskRepeatPattern" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

CREATE TABLE "Task" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "TaskType" NOT NULL DEFAULT 'OTHER',
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "dueDate" TIMESTAMP(3),
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
  "repeatPattern" "TaskRepeatPattern" NOT NULL DEFAULT 'NONE',
  "completedAt" TIMESTAMP(3),
  "recurrenceSourceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Task_completion_check" CHECK (("status" = 'COMPLETED') = ("completedAt" IS NOT NULL)),
  CONSTRAINT "Task_repeat_due_date_check" CHECK ("repeatPattern" = 'NONE' OR "dueDate" IS NOT NULL)
);

CREATE UNIQUE INDEX "Task_recurrenceSourceId_key" ON "Task"("recurrenceSourceId");
CREATE INDEX "Task_userId_deletedAt_idx" ON "Task"("userId", "deletedAt");
CREATE INDEX "Task_userId_dueDate_idx" ON "Task"("userId", "dueDate");
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");
CREATE INDEX "Task_userId_type_idx" ON "Task"("userId", "type");
CREATE INDEX "Task_userId_priority_idx" ON "Task"("userId", "priority");

ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_recurrenceSourceId_fkey" FOREIGN KEY ("recurrenceSourceId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
