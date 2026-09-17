-- AlterTable
ALTER TABLE "User" ADD COLUMN "adminLocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN "creatorAccountDeletedAt" TIMESTAMP(3);

-- Existing unlinked estimates were retained when a customer deleted their account.
UPDATE "Estimate"
SET "creatorAccountDeletedAt" = COALESCE("updatedAt", NOW())
WHERE "userId" IS NULL
  AND "creatorAccountDeletedAt" IS NULL;
