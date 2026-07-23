import {
  AIRDROP_CATEGORY,
  URGENCY,
  type AirdropCategory,
  type Urgency,
} from "@/lib/domain/airdrop.constants";
import type { BoardSnapshot, NeedSummary, SiteSummary } from "@/lib/domain/airdrop.types";

/**
 * Temporary UI fixture for Phase 1. Replaced by `GET /api/needs` once Prisma and
 * Supabase are wired — `fetchBoardSnapshot` is the seam, nothing else imports this.
 */

interface MockNeedSeed {
  readonly id: string;
  readonly itemName: string;
  readonly unit: string;
  readonly category: AirdropCategory;
  readonly qtyRequested: number;
  readonly qtyFulfilled: number;
  readonly qtyReserved: number;
  readonly urgency: Urgency;
  readonly activeContributorCount: number;
  readonly updatedMinutesAgo: number;
}

const MOCK_SITE: SiteSummary = {
  id: "site_jantar_mantar",
  name: "Jantar Mantar",
  areaLabel: "Near Jantar Mantar, New Delhi",
  isFrozen: false,
  dropPoints: [{ id: "dp_seed_gate3", label: "Gate 3 medical tent" }],
};

const MOCK_NEED_SEEDS: readonly MockNeedSeed[] = [
  {
    id: "need_raincoat",
    itemName: "Raincoats",
    unit: "piece",
    category: AIRDROP_CATEGORY.RAIN,
    qtyRequested: 150,
    qtyFulfilled: 28,
    qtyReserved: 12,
    urgency: URGENCY.URGENT,
    activeContributorCount: 3,
    updatedMinutesAgo: 2,
  },
  {
    id: "need_ors",
    itemName: "ORS Sachets",
    unit: "sachet",
    category: AIRDROP_CATEGORY.MEDICAL,
    qtyRequested: 400,
    qtyFulfilled: 55,
    qtyReserved: 0,
    urgency: URGENCY.URGENT,
    activeContributorCount: 1,
    updatedMinutesAgo: 6,
  },
  {
    id: "need_water",
    itemName: "Water Bottles (1L)",
    unit: "bottle",
    category: AIRDROP_CATEGORY.WATER,
    qtyRequested: 500,
    qtyFulfilled: 380,
    qtyReserved: 20,
    urgency: URGENCY.HIGH,
    activeContributorCount: 2,
    updatedMinutesAgo: 1,
  },
  {
    id: "need_towel",
    itemName: "Cotton Towels",
    unit: "piece",
    category: AIRDROP_CATEGORY.COMFORT,
    qtyRequested: 200,
    qtyFulfilled: 40,
    qtyReserved: 0,
    urgency: URGENCY.HIGH,
    activeContributorCount: 0,
    updatedMinutesAgo: 14,
  },
  {
    id: "need_biscuit",
    itemName: "Biscuit Packets",
    unit: "packet",
    category: AIRDROP_CATEGORY.FOOD,
    qtyRequested: 300,
    qtyFulfilled: 120,
    qtyReserved: 15,
    urgency: URGENCY.NORMAL,
    activeContributorCount: 4,
    updatedMinutesAgo: 4,
  },
  {
    id: "need_mask",
    itemName: "N95 Masks",
    unit: "piece",
    category: AIRDROP_CATEGORY.SAFETY,
    qtyRequested: 250,
    qtyFulfilled: 90,
    qtyReserved: 0,
    urgency: URGENCY.NORMAL,
    activeContributorCount: 0,
    updatedMinutesAgo: 22,
  },
  {
    id: "need_bandage",
    itemName: "Bandage Rolls",
    unit: "roll",
    category: AIRDROP_CATEGORY.MEDICAL,
    qtyRequested: 120,
    qtyFulfilled: 96,
    qtyReserved: 8,
    urgency: URGENCY.NORMAL,
    activeContributorCount: 1,
    updatedMinutesAgo: 31,
  },
  {
    id: "need_tarp",
    itemName: "Plastic Tarpaulin Sheets",
    unit: "sheet",
    category: AIRDROP_CATEGORY.RAIN,
    qtyRequested: 60,
    qtyFulfilled: 58,
    qtyReserved: 0,
    urgency: URGENCY.NORMAL,
    activeContributorCount: 0,
    updatedMinutesAgo: 48,
  },
  // Deliberately large: exercises formatCompactQuantity on the headline while
  // the meter line below it stays exact.
  {
    id: "need_water_pouch",
    itemName: "Drinking Water Pouches",
    unit: "pouch",
    category: AIRDROP_CATEGORY.WATER,
    qtyRequested: 25_000,
    qtyFulfilled: 1_200,
    qtyReserved: 0,
    urgency: URGENCY.HIGH,
    activeContributorCount: 6,
    updatedMinutesAgo: 3,
  },
  {
    id: "need_sanitary_pads",
    itemName: "Sanitary Pads",
    unit: "packet",
    category: AIRDROP_CATEGORY.MEDICAL,
    qtyRequested: 300,
    qtyFulfilled: 45,
    qtyReserved: 10,
    urgency: URGENCY.URGENT,
    activeContributorCount: 2,
    updatedMinutesAgo: 8,
  },
  {
    id: "need_sanitizer",
    itemName: "Hand Sanitizer Bottles",
    unit: "bottle",
    category: AIRDROP_CATEGORY.MEDICAL,
    qtyRequested: 180,
    qtyFulfilled: 60,
    qtyReserved: 0,
    urgency: URGENCY.NORMAL,
    activeContributorCount: 0,
    updatedMinutesAgo: 26,
  },
  {
    id: "need_blanket",
    itemName: "Blankets",
    unit: "piece",
    category: AIRDROP_CATEGORY.COMFORT,
    qtyRequested: 220,
    qtyFulfilled: 35,
    qtyReserved: 5,
    urgency: URGENCY.HIGH,
    activeContributorCount: 1,
    updatedMinutesAgo: 11,
  },
  {
    id: "need_umbrella",
    itemName: "Umbrellas",
    unit: "piece",
    category: AIRDROP_CATEGORY.RAIN,
    qtyRequested: 140,
    qtyFulfilled: 22,
    qtyReserved: 0,
    urgency: URGENCY.NORMAL,
    activeContributorCount: 0,
    updatedMinutesAgo: 35,
  },
  {
    id: "need_chai",
    itemName: "Chai Flasks",
    unit: "flask",
    category: AIRDROP_CATEGORY.FOOD,
    qtyRequested: 90,
    qtyFulfilled: 18,
    qtyReserved: 4,
    urgency: URGENCY.NORMAL,
    activeContributorCount: 2,
    updatedMinutesAgo: 5,
  },
  {
    id: "need_torch",
    itemName: "Torch Batteries",
    unit: "packet",
    category: AIRDROP_CATEGORY.SAFETY,
    qtyRequested: 160,
    qtyFulfilled: 30,
    qtyReserved: 0,
    urgency: URGENCY.NORMAL,
    activeContributorCount: 0,
    updatedMinutesAgo: 19,
  },
  {
    id: "need_paper_cups",
    itemName: "Paper Cups",
    unit: "sleeve",
    category: AIRDROP_CATEGORY.FOOD,
    qtyRequested: 400,
    qtyFulfilled: 210,
    qtyReserved: 0,
    urgency: URGENCY.NORMAL,
    activeContributorCount: 0,
    updatedMinutesAgo: 41,
  },
];

function toNeedSummary(seed: MockNeedSeed, now: Date): NeedSummary {
  const updatedAt = new Date(now.getTime() - seed.updatedMinutesAgo * 60_000);

  return {
    id: seed.id,
    itemName: seed.itemName,
    unit: seed.unit,
    category: seed.category,
    qtyRequested: seed.qtyRequested,
    qtyFulfilled: seed.qtyFulfilled,
    qtyReserved: seed.qtyReserved,
    // Mirrors the Postgres generated column exactly.
    shortfall: Math.max(
      0,
      seed.qtyRequested - seed.qtyFulfilled - seed.qtyReserved,
    ),
    urgency: seed.urgency,
    activeContributorCount: seed.activeContributorCount,
    updatedAt: updatedAt.toISOString(),
  };
}

/** Built against a caller-supplied clock so it is only ever evaluated client-side. */
export function buildMockBoardSnapshot(now: Date): BoardSnapshot {
  return {
    site: MOCK_SITE,
    needs: MOCK_NEED_SEEDS.map((seed) => toNeedSummary(seed, now)),
  };
}
