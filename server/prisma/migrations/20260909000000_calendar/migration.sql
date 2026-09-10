CREATE TYPE "CalendarEventType" AS ENUM ('INTERVIEW', 'FOLLOW_UP', 'DEADLINE', 'OTHER');

CREATE TABLE "CalendarEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "CalendarEventType" NOT NULL DEFAULT 'OTHER',
  "startAt" TIMESTAMPTZ(3) NOT NULL,
  "endAt" TIMESTAMPTZ(3),
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "reminders" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "companyId" TEXT,
  "contactId" TEXT,
  "applicationId" TEXT,
  "taskId" TEXT,
  "projectId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CalendarEvent_title_check" CHECK (char_length(btrim("title")) BETWEEN 2 AND 200),
  CONSTRAINT "CalendarEvent_interval_check" CHECK ("endAt" IS NULL OR "endAt" > "startAt"),
  CONSTRAINT "CalendarEvent_one_source_check" CHECK (
    ("companyId" IS NOT NULL)::INTEGER + ("contactId" IS NOT NULL)::INTEGER +
    ("applicationId" IS NOT NULL)::INTEGER + ("taskId" IS NOT NULL)::INTEGER +
    ("projectId" IS NOT NULL)::INTEGER <= 1
  ),
  CONSTRAINT "CalendarEvent_reminders_check" CHECK (
    cardinality("reminders") <= 5 AND
    (cardinality("reminders") = 0 OR (array_ndims("reminders") = 1 AND array_lower("reminders", 1) = 1)) AND
    array_position("reminders", NULL) IS NULL AND
    0 <= ALL("reminders") AND 10080 >= ALL("reminders") AND
    (cardinality("reminders") < 2 OR "reminders"[1] < "reminders"[2]) AND
    (cardinality("reminders") < 3 OR "reminders"[2] < "reminders"[3]) AND
    (cardinality("reminders") < 4 OR "reminders"[3] < "reminders"[4]) AND
    (cardinality("reminders") < 5 OR "reminders"[4] < "reminders"[5])
  )
);

CREATE INDEX "CalendarEvent_userId_deletedAt_startAt_id_idx" ON "CalendarEvent"("userId", "deletedAt", "startAt", "id");
CREATE INDEX "CalendarEvent_userId_endAt_idx" ON "CalendarEvent"("userId", "endAt");
CREATE INDEX "CalendarEvent_userId_type_idx" ON "CalendarEvent"("userId", "type");
CREATE INDEX "CalendarEvent_companyId_idx" ON "CalendarEvent"("companyId");
CREATE INDEX "CalendarEvent_contactId_idx" ON "CalendarEvent"("contactId");
CREATE INDEX "CalendarEvent_applicationId_idx" ON "CalendarEvent"("applicationId");
CREATE INDEX "CalendarEvent_taskId_idx" ON "CalendarEvent"("taskId");
CREATE INDEX "CalendarEvent_projectId_idx" ON "CalendarEvent"("projectId");

ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
