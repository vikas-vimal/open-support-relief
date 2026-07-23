-- Migration 0001 — initial schema
-- Generated from prisma/schema.prisma via `prisma migrate diff` (read-only), then committed.
-- Apply MANUALLY, never via `prisma migrate`:
--   psql "$DIRECT_URL" -f db/migrations/0001_init.sql
-- Idempotent-ish: wrapped in a transaction; re-running errors on existing objects
-- (expected — check _manual_migrations before re-applying).

BEGIN;

-- Version tracking for manually-applied SQL migrations.
CREATE TABLE IF NOT EXISTS "_manual_migrations" (
  "version"    TEXT PRIMARY KEY,
  "applied_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PUBLIC', 'VOLUNTEER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ClaimState" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestState" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'MERGED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PUBLIC',
    "displayName" TEXT,
    "showOnWall" BOOLEAN NOT NULL DEFAULT false,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaLabel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropPoint" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fullAddress" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DropPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SupplyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Need" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "qtyRequested" INTEGER NOT NULL,
    "qtyFulfilled" INTEGER NOT NULL DEFAULT 0,
    "qtyReserved" INTEGER NOT NULL DEFAULT 0,
    "urgency" "Urgency" NOT NULL DEFAULT 'NORMAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Need_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeedEvent" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NeedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qtyClaimed" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "orderRef" TEXT,
    "state" "ClaimState" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofImage" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "purgeAfter" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intent" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Intent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemRequest" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "proposedName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "qtyRequested" INTEGER NOT NULL,
    "note" TEXT,
    "requestedById" TEXT NOT NULL,
    "state" "RequestState" NOT NULL DEFAULT 'PENDING_REVIEW',
    "mergedIntoNeedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ItemRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Site_isActive_idx" ON "Site"("isActive");

-- CreateIndex
CREATE INDEX "DropPoint_siteId_isActive_idx" ON "DropPoint"("siteId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SupplyItem_name_key" ON "SupplyItem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SupplyItem_normalized_key" ON "SupplyItem"("normalized");

-- CreateIndex
CREATE INDEX "SupplyItem_category_idx" ON "SupplyItem"("category");

-- CreateIndex
CREATE INDEX "Need_siteId_isActive_urgency_idx" ON "Need"("siteId", "isActive", "urgency");

-- CreateIndex
CREATE UNIQUE INDEX "Need_siteId_itemId_key" ON "Need"("siteId", "itemId");

-- CreateIndex
CREATE INDEX "NeedEvent_needId_createdAt_idx" ON "NeedEvent"("needId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_idempotencyKey_key" ON "Contribution"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Contribution_needId_state_idx" ON "Contribution"("needId", "state");

-- CreateIndex
CREATE INDEX "Contribution_userId_idx" ON "Contribution"("userId");

-- CreateIndex
CREATE INDEX "ProofImage_purgeAfter_idx" ON "ProofImage"("purgeAfter");

-- CreateIndex
CREATE INDEX "Intent_needId_idx" ON "Intent"("needId");

-- CreateIndex
CREATE INDEX "Intent_expiresAt_idx" ON "Intent"("expiresAt");

-- CreateIndex
CREATE INDEX "ItemRequest_siteId_state_idx" ON "ItemRequest"("siteId", "state");

-- CreateIndex
CREATE INDEX "ItemRequest_siteId_normalizedName_idx" ON "ItemRequest"("siteId", "normalizedName");

-- CreateIndex
CREATE INDEX "RateLimit_windowStart_idx" ON "RateLimit"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_userId_action_windowStart_key" ON "RateLimit"("userId", "action", "windowStart");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "DropPoint" ADD CONSTRAINT "DropPoint_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Need" ADD CONSTRAINT "Need_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Need" ADD CONSTRAINT "Need_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SupplyItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedEvent" ADD CONSTRAINT "NeedEvent_needId_fkey" FOREIGN KEY ("needId") REFERENCES "Need"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_needId_fkey" FOREIGN KEY ("needId") REFERENCES "Need"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofImage" ADD CONSTRAINT "ProofImage_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intent" ADD CONSTRAINT "Intent_needId_fkey" FOREIGN KEY ("needId") REFERENCES "Need"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRequest" ADD CONSTRAINT "ItemRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


INSERT INTO "_manual_migrations" ("version") VALUES ('0001_init')
  ON CONFLICT ("version") DO NOTHING;

COMMIT;
