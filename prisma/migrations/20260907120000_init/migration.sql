-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'REVIEWER', 'ADMIN', 'APPROVER');

-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('IN_PROGRESS', 'REVIEWED', 'CALCULATED', 'LEAD_CAPTURED', 'EXPIRED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('pending', 'clean', 'infected', 'error', 'skipped');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('draft', 'in_review', 'pending_approval', 'approved', 'issued', 'accepted', 'declined', 'withdrawn');

-- CreateEnum
CREATE TYPE "QuoteVersionStatus" AS ENUM ('draft', 'frozen', 'issued', 'superseded');

-- CreateEnum
CREATE TYPE "QuoteLineKind" AS ENUM ('work_package', 'role', 'custom', 'third_party', 'discount', 'other');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "PreferredNextStep" AS ENUM ('email', 'call', 'workshop', 'upload_brief', 'none');

-- CreateEnum
CREATE TYPE "AnswerRevisionSource" AS ENUM ('autosave', 'review_edit', 'recalculate', 'admin', 'system');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingVersion" (
    "id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT true,
    "snapshot" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedById" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingDraft" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'default',
    "config" JSONB NOT NULL DEFAULT '{}',
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "EstimateStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "answers" JSONB NOT NULL DEFAULT '{}',
    "concept" JSONB,
    "lastScreen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerRevision" (
    "id" UUID NOT NULL,
    "estimateId" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "source" "AnswerRevisionSource" NOT NULL DEFAULT 'autosave',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateResult" (
    "id" UUID NOT NULL,
    "estimateId" UUID NOT NULL,
    "pricingVersionId" UUID,
    "publicResult" JSONB NOT NULL,
    "calculationTrace" JSONB NOT NULL,
    "checksum" TEXT NOT NULL,
    "isDiscoveryFirst" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimateResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "estimateId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),
    "preferredNextStep" "PreferredNextStep",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedBrief" (
    "id" UUID NOT NULL,
    "estimateId" UUID NOT NULL,
    "storagePath" TEXT NOT NULL,
    "originalFilename" TEXT,
    "mime" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "scanStatus" "ScanStatus" NOT NULL DEFAULT 'pending',
    "scanDetail" JSONB NOT NULL DEFAULT '{}',
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewedQuotation" (
    "id" UUID NOT NULL,
    "estimateResultId" UUID NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'draft',
    "assignedToId" UUID,
    "title" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "selectedScenario" TEXT,
    "internalNotes" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewedQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteVersion" (
    "id" UUID NOT NULL,
    "quotationId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "QuoteVersionStatus" NOT NULL DEFAULT 'draft',
    "frozenSnapshot" JSONB NOT NULL DEFAULT '{}',
    "lineItemsSnapshot" JSONB NOT NULL DEFAULT '[]',
    "milestonesSnapshot" JSONB NOT NULL DEFAULT '[]',
    "overrides" JSONB NOT NULL DEFAULT '[]',
    "overrideReasons" JSONB NOT NULL DEFAULT '[]',
    "subtotalZar" DECIMAL(14,2),
    "taxZar" DECIMAL(14,2),
    "totalZar" DECIMAL(14,2),
    "issuedAt" TIMESTAMP(3),
    "issuedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLineItem" (
    "id" UUID NOT NULL,
    "quoteVersionId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "kind" "QuoteLineKind" NOT NULL DEFAULT 'custom',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "unitAmountZar" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amountZar" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteMilestone" (
    "id" UUID NOT NULL,
    "quoteVersionId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "percent" DECIMAL(5,2),
    "amountZar" DECIMAL(14,2),
    "dueLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteApproval" (
    "id" UUID NOT NULL,
    "quoteVersionId" UUID NOT NULL,
    "requestedById" UUID,
    "approverUserId" UUID,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "thresholdLabel" TEXT,
    "decisionNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" UUID NOT NULL,
    "eventName" TEXT NOT NULL,
    "estimateId" UUID,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationRecord" (
    "id" UUID NOT NULL,
    "estimateResultId" UUID,
    "quotationId" UUID,
    "quoteVersionId" UUID,
    "originalEstimateSnapshot" JSONB NOT NULL DEFAULT '{}',
    "reviewedQuoteSnapshot" JSONB NOT NULL DEFAULT '{}',
    "agreedScopeSnapshot" JSONB NOT NULL DEFAULT '{}',
    "actualEffortHours" DECIMAL(12,2),
    "actualDurationWeeks" DECIMAL(8,2),
    "changeRequests" JSONB NOT NULL DEFAULT '[]',
    "varianceReasons" JSONB NOT NULL DEFAULT '[]',
    "recommendations" TEXT,
    "recordedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalibrationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PricingVersion_version_key" ON "PricingVersion"("version");

-- CreateIndex
CREATE UNIQUE INDEX "PricingDraft_label_key" ON "PricingDraft"("label");

-- CreateIndex
CREATE INDEX "Estimate_userId_updatedAt_idx" ON "Estimate"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Estimate_status_idx" ON "Estimate"("status");

-- CreateIndex
CREATE INDEX "AnswerRevision_estimateId_revision_idx" ON "AnswerRevision"("estimateId", "revision" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "AnswerRevision_estimateId_revision_key" ON "AnswerRevision"("estimateId", "revision");

-- CreateIndex
CREATE INDEX "EstimateResult_estimateId_createdAt_idx" ON "EstimateResult"("estimateId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "EstimateResult_createdAt_idx" ON "EstimateResult"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_estimateId_key" ON "Lead"("estimateId");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_userId_idx" ON "Lead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UploadedBrief_storagePath_key" ON "UploadedBrief"("storagePath");

-- CreateIndex
CREATE INDEX "UploadedBrief_estimateId_idx" ON "UploadedBrief"("estimateId");

-- CreateIndex
CREATE INDEX "UploadedBrief_scanStatus_idx" ON "UploadedBrief"("scanStatus");

-- CreateIndex
CREATE INDEX "ReviewedQuotation_status_idx" ON "ReviewedQuotation"("status");

-- CreateIndex
CREATE INDEX "ReviewedQuotation_estimateResultId_idx" ON "ReviewedQuotation"("estimateResultId");

-- CreateIndex
CREATE INDEX "QuoteVersion_status_idx" ON "QuoteVersion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteVersion_quotationId_versionNumber_key" ON "QuoteVersion"("quotationId", "versionNumber");

-- CreateIndex
CREATE INDEX "QuoteLineItem_quoteVersionId_sortOrder_idx" ON "QuoteLineItem"("quoteVersionId", "sortOrder");

-- CreateIndex
CREATE INDEX "QuoteMilestone_quoteVersionId_sortOrder_idx" ON "QuoteMilestone"("quoteVersionId", "sortOrder");

-- CreateIndex
CREATE INDEX "QuoteApproval_quoteVersionId_idx" ON "QuoteApproval"("quoteVersionId");

-- CreateIndex
CREATE INDEX "QuoteApproval_status_idx" ON "QuoteApproval"("status");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventName_idx" ON "AnalyticsEvent"("eventName");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_estimateId_idx" ON "AnalyticsEvent"("estimateId");

-- CreateIndex
CREATE INDEX "CalibrationRecord_createdAt_idx" ON "CalibrationRecord"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "CalibrationRecord_estimateResultId_idx" ON "CalibrationRecord"("estimateResultId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUserId_idx" ON "AuditEvent"("actorUserId");

-- AddForeignKey
ALTER TABLE "PricingVersion" ADD CONSTRAINT "PricingVersion_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingDraft" ADD CONSTRAINT "PricingDraft_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerRevision" ADD CONSTRAINT "AnswerRevision_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateResult" ADD CONSTRAINT "EstimateResult_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateResult" ADD CONSTRAINT "EstimateResult_pricingVersionId_fkey" FOREIGN KEY ("pricingVersionId") REFERENCES "PricingVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedBrief" ADD CONSTRAINT "UploadedBrief_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewedQuotation" ADD CONSTRAINT "ReviewedQuotation_estimateResultId_fkey" FOREIGN KEY ("estimateResultId") REFERENCES "EstimateResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewedQuotation" ADD CONSTRAINT "ReviewedQuotation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewedQuotation" ADD CONSTRAINT "ReviewedQuotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "ReviewedQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_quoteVersionId_fkey" FOREIGN KEY ("quoteVersionId") REFERENCES "QuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteMilestone" ADD CONSTRAINT "QuoteMilestone_quoteVersionId_fkey" FOREIGN KEY ("quoteVersionId") REFERENCES "QuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteApproval" ADD CONSTRAINT "QuoteApproval_quoteVersionId_fkey" FOREIGN KEY ("quoteVersionId") REFERENCES "QuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteApproval" ADD CONSTRAINT "QuoteApproval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteApproval" ADD CONSTRAINT "QuoteApproval_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationRecord" ADD CONSTRAINT "CalibrationRecord_estimateResultId_fkey" FOREIGN KEY ("estimateResultId") REFERENCES "EstimateResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationRecord" ADD CONSTRAINT "CalibrationRecord_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "ReviewedQuotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationRecord" ADD CONSTRAINT "CalibrationRecord_quoteVersionId_fkey" FOREIGN KEY ("quoteVersionId") REFERENCES "QuoteVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationRecord" ADD CONSTRAINT "CalibrationRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

