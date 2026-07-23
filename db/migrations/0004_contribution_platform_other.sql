-- Migration 0004 — Contribution.platformOther (custom vendor name for OTHER)
-- Apply MANUALLY, after 0003:
--   psql "$DIRECT_URL" -f db/migrations/0004_contribution_platform_other.sql
-- Additive, nullable column — safe on a populated table, no backfill needed.

BEGIN;

-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "platformOther" TEXT;


INSERT INTO "_manual_migrations" ("version") VALUES ('0004_contribution_platform_other')
  ON CONFLICT ("version") DO NOTHING;

COMMIT;
