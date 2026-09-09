-- Drop unused estimator scaffolding and add lockout + profile-save fields.

DROP TABLE IF EXISTS "QuoteApproval";
DROP TABLE IF EXISTS "CalibrationRecord";
DROP TABLE IF EXISTS "UploadedBrief";
DROP TABLE IF EXISTS "PricingDraft";

ALTER TABLE "EstimateResult" DROP CONSTRAINT IF EXISTS "EstimateResult_pricingVersionId_fkey";
ALTER TABLE "EstimateResult" DROP COLUMN IF EXISTS "pricingVersionId";

DROP TABLE IF EXISTS "PricingVersion";

DROP TYPE IF EXISTS "ScanStatus";
DROP TYPE IF EXISTS "ApprovalStatus";

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "savedToProfileAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Estimate_userId_savedToProfileAt_idx" ON "Estimate"("userId", "savedToProfileAt");
