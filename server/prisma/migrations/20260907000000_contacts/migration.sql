-- Run after 20260813094426_init_crm_foundation, which converts User/Company keys to TEXT.

CREATE TABLE "Contact" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "photo" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "linkedIn" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "notes" TEXT,
  "lastContactAt" TIMESTAMP(3) NOT NULL,
  "nextFollowUpAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");
CREATE INDEX "Contact_userId_deletedAt_idx" ON "Contact"("userId", "deletedAt");
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");
