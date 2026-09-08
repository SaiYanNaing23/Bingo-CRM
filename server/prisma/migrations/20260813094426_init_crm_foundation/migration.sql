/*
  Warnings:

  - The primary key for the `Company` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Contact'
  ) THEN
    EXECUTE 'ALTER TABLE "Contact" DROP CONSTRAINT IF EXISTS "Contact_userId_fkey"';
    EXECUTE 'ALTER TABLE "Contact" DROP CONSTRAINT IF EXISTS "Contact_companyId_fkey"';
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_userId_fkey";

-- AlterTable
ALTER TABLE "Company" DROP CONSTRAINT "Company_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ADD CONSTRAINT "Company_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Contact'
  ) THEN
    EXECUTE 'ALTER TABLE "Contact" DROP CONSTRAINT IF EXISTS "Contact_userId_fkey"';
    EXECUTE 'ALTER TABLE "Contact" DROP CONSTRAINT IF EXISTS "Contact_companyId_fkey"';
    EXECUTE 'ALTER TABLE "Contact" ALTER COLUMN "id" DROP DEFAULT';
    EXECUTE 'ALTER TABLE "Contact" ALTER COLUMN "id" SET DATA TYPE TEXT';
    EXECUTE 'ALTER TABLE "Contact" ALTER COLUMN "userId" SET DATA TYPE TEXT';
    EXECUTE 'ALTER TABLE "Contact" ALTER COLUMN "companyId" SET DATA TYPE TEXT';
  END IF;
END $$;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Contact'
  ) THEN
    EXECUTE 'ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE';
    EXECUTE 'ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE';
  END IF;
END $$;
