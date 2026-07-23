-- Migration 0005 — moderation v2: parcel matching code + reasoned disputes
-- Apply MANUALLY, after 0004:
--   psql "$DIRECT_URL" -f db/migrations/0005_moderation_v2.sql
--
-- All additive: a new enum value, four nullable columns, three indexes. No
-- backfill needed. The generated diff also emitted `DROP TABLE
-- "_manual_migrations"` (it isn't in schema.prisma) — that DROP was removed by
-- hand, as the migration rule requires.
--
-- ALTER TYPE ... ADD VALUE inside a transaction is safe on PostgreSQL 12+ (Supabase
-- is 15) as long as the new value is not USED in the same transaction — it is not.

BEGIN;

-- AlterEnum
ALTER TYPE "ClaimState" ADD VALUE 'DISPUTED';

-- AlterTable — parcel matching code + dispute detail
ALTER TABLE "Contribution"
  ADD COLUMN "receiverCode" TEXT,
  ADD COLUMN "reviewReason" TEXT,
  ADD COLUMN "reviewNote"   TEXT,
  ADD COLUMN "qtyReceived"  INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_receiverCode_key" ON "Contribution"("receiverCode");
CREATE INDEX "Contribution_createdAt_idx" ON "Contribution"("createdAt");
CREATE INDEX "Contribution_platform_idx" ON "Contribution"("platform");

INSERT INTO "_manual_migrations" ("version") VALUES ('0005_moderation_v2')
  ON CONFLICT ("version") DO NOTHING;

COMMIT;
