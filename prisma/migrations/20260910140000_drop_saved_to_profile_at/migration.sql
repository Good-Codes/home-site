-- Remove unused profile-save flag. Estimate rows stay for resume and admin.

DROP INDEX IF EXISTS "Estimate_userId_savedToProfileAt_idx";

ALTER TABLE "Estimate" DROP COLUMN IF EXISTS "savedToProfileAt";
