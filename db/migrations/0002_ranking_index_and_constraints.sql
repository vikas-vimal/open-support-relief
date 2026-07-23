-- Migration 0002 — ranking index and counter constraints
-- Apply MANUALLY, after 0001:
--   psql "$DIRECT_URL" -f db/migrations/0002_ranking_index_and_constraints.sql
--
-- These cannot be expressed in prisma/schema.prisma, which is why they are a
-- separate hand-written migration.

BEGIN;

-- Board ranking is ORDER BY urgency DESC, (qtyRequested - qtyFulfilled - qtyReserved) DESC.
-- shortfall is never stored (it cannot drift from the counters), so this
-- functional index keeps the ranking query index-backed instead of sorting in memory.
CREATE INDEX IF NOT EXISTS "need_shortfall_rank_idx"
  ON "Need" (
    "siteId",
    "isActive",
    "urgency" DESC,
    (GREATEST(0, "qtyRequested" - "qtyFulfilled" - "qtyReserved")) DESC
  );

-- Enforces the counter invariants at the database level, independent of app code:
-- fulfilled and reserved can never exceed the request, and none can go negative.
ALTER TABLE "Need"
  DROP CONSTRAINT IF EXISTS "need_counters_nonneg";
ALTER TABLE "Need"
  ADD CONSTRAINT "need_counters_nonneg"
    CHECK (
      "qtyRequested" >= 0
      AND "qtyFulfilled" >= 0
      AND "qtyReserved" >= 0
      AND "qtyFulfilled" + "qtyReserved" <= "qtyRequested"
    );

INSERT INTO "_manual_migrations" ("version") VALUES ('0002_ranking_index_and_constraints')
  ON CONFLICT ("version") DO NOTHING;

COMMIT;
