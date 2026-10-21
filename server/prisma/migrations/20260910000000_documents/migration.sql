CREATE TYPE "DocumentType" AS ENUM ('RESUME', 'COVER_LETTER', 'CERTIFICATE', 'ASSIGNMENT', 'OFFER_LETTER', 'CONTRACT', 'OTHER');

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "DocumentType" NOT NULL DEFAULT 'OTHER',
  "description" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "companyId" TEXT,
  "contactId" TEXT,
  "applicationId" TEXT,
  "taskId" TEXT,
  "projectId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Document_title_check" CHECK (char_length(btrim("title")) BETWEEN 2 AND 200),
  CONSTRAINT "Document_one_source_check" CHECK (
    ("companyId" IS NOT NULL)::INTEGER + ("contactId" IS NOT NULL)::INTEGER +
    ("applicationId" IS NOT NULL)::INTEGER + ("taskId" IS NOT NULL)::INTEGER +
    ("projectId" IS NOT NULL)::INTEGER <= 1
  )
);

CREATE TABLE "DocumentVersion" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "storageProvider" TEXT NOT NULL DEFAULT 'METADATA',
  "storageKey" TEXT,
  "changelog" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DocumentVersion_documentId_version_key" UNIQUE ("documentId", "version"),
  CONSTRAINT "DocumentVersion_fileName_check" CHECK (char_length(btrim("fileName")) BETWEEN 1 AND 255),
  CONSTRAINT "DocumentVersion_fileSize_check" CHECK ("fileSize" > 0),
  CONSTRAINT "DocumentVersion_version_check" CHECK ("version" >= 1)
);

CREATE INDEX "Document_userId_deletedAt_idx" ON "Document"("userId", "deletedAt");
CREATE INDEX "Document_userId_type_deletedAt_idx" ON "Document"("userId", "type", "deletedAt");
CREATE INDEX "Document_userId_updatedAt_idx" ON "Document"("userId", "updatedAt");
CREATE INDEX "Document_companyId_idx" ON "Document"("companyId");
CREATE INDEX "Document_contactId_idx" ON "Document"("contactId");
CREATE INDEX "Document_applicationId_idx" ON "Document"("applicationId");
CREATE INDEX "Document_taskId_idx" ON "Document"("taskId");
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");
CREATE INDEX "Document_tags_idx" ON "Document" USING GIN ("tags");

CREATE INDEX "DocumentVersion_documentId_deletedAt_idx" ON "DocumentVersion"("documentId", "deletedAt");
CREATE INDEX "DocumentVersion_userId_deletedAt_idx" ON "DocumentVersion"("userId", "deletedAt");

ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

