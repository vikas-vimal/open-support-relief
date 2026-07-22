/**
 * Shared airdrop-domain constants. Values only — helpers live in `*.util.ts`.
 */

export const AIRDROP_CATEGORY = {
  WATER: "WATER",
  FOOD: "FOOD",
  MEDICAL: "MEDICAL",
  RAIN: "RAIN",
  COMFORT: "COMFORT",
  SAFETY: "SAFETY",
} as const;

export type AirdropCategory =
  (typeof AIRDROP_CATEGORY)[keyof typeof AIRDROP_CATEGORY];

/** Display order of the filter chips, left to right. */
export const AIRDROP_CATEGORY_ORDER: readonly AirdropCategory[] = [
  AIRDROP_CATEGORY.WATER,
  AIRDROP_CATEGORY.FOOD,
  AIRDROP_CATEGORY.MEDICAL,
  AIRDROP_CATEGORY.RAIN,
  AIRDROP_CATEGORY.COMFORT,
  AIRDROP_CATEGORY.SAFETY,
] as const;

export const AIRDROP_CATEGORY_LABEL: Readonly<Record<AirdropCategory, string>> = {
  [AIRDROP_CATEGORY.WATER]: "Water",
  [AIRDROP_CATEGORY.FOOD]: "Food",
  [AIRDROP_CATEGORY.MEDICAL]: "Medical",
  [AIRDROP_CATEGORY.RAIN]: "Rain",
  [AIRDROP_CATEGORY.COMFORT]: "Comfort",
  [AIRDROP_CATEGORY.SAFETY]: "Safety",
};

/** Chip glyphs. Recognition beats reading when scanning a filter row one-handed. */
export const AIRDROP_CATEGORY_EMOJI: Readonly<Record<AirdropCategory, string>> = {
  [AIRDROP_CATEGORY.WATER]: "💧",
  [AIRDROP_CATEGORY.FOOD]: "🍞",
  [AIRDROP_CATEGORY.MEDICAL]: "🩹",
  [AIRDROP_CATEGORY.RAIN]: "🌧️",
  [AIRDROP_CATEGORY.COMFORT]: "🧣",
  [AIRDROP_CATEGORY.SAFETY]: "😷",
};

/** Sentinel for the "no category filter" chip. */
export const CATEGORY_FILTER_ALL = "ALL" as const;

export const CATEGORY_FILTER_ALL_EMOJI = "📋";

export type CategoryFilter = AirdropCategory | typeof CATEGORY_FILTER_ALL;

export const URGENCY = {
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type Urgency = (typeof URGENCY)[keyof typeof URGENCY];

/**
 * Sort weight. Mirrors the Postgres enum ordering used by the board's composite
 * index (`urgency DESC, shortfall DESC`) so client and server rank identically.
 */
export const URGENCY_WEIGHT: Readonly<Record<Urgency, number>> = {
  [URGENCY.NORMAL]: 1,
  [URGENCY.HIGH]: 2,
  [URGENCY.URGENT]: 3,
};

/** Below this fill ratio an item is treated as critically short. */
export const CRITICAL_FILL_RATIO = 0.2;

/** Quick-commerce platforms a contributor can order through. */
export const FULFILMENT_PLATFORM = {
  BLINKIT: "BLINKIT",
  ZEPTO: "ZEPTO",
  SWIGGY: "SWIGGY",
  ZOMATO: "ZOMATO",
  AMAZON: "AMAZON",
  OTHER: "OTHER",
} as const;

export type FulfilmentPlatform =
  (typeof FULFILMENT_PLATFORM)[keyof typeof FULFILMENT_PLATFORM];

export const FULFILMENT_PLATFORM_LABEL: Readonly<
  Record<FulfilmentPlatform, string>
> = {
  [FULFILMENT_PLATFORM.BLINKIT]: "Blinkit",
  [FULFILMENT_PLATFORM.ZEPTO]: "Zepto",
  [FULFILMENT_PLATFORM.SWIGGY]: "Swiggy",
  [FULFILMENT_PLATFORM.ZOMATO]: "Zomato",
  [FULFILMENT_PLATFORM.AMAZON]: "Amazon",
  [FULFILMENT_PLATFORM.OTHER]: "Other",
};

/** How long a contributor's soft reservation holds quantity off the board. */
export const INTENT_LOCK_TTL_MINUTES = 15;

/** Lifecycle of a publicly proposed item, pending moderator review. */
export const ITEM_REQUEST_STATE = {
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  /** Folded into an existing need — the usual outcome for a near-duplicate. */
  MERGED: "MERGED",
} as const;

export type ItemRequestState =
  (typeof ITEM_REQUEST_STATE)[keyof typeof ITEM_REQUEST_STATE];

/**
 * Similarity at or above this is treated as "probably the same item" and shown
 * as a duplicate warning before a proposal can be submitted.
 */
export const DUPLICATE_MATCH_THRESHOLD = 0.5;

/** Most duplicate suggestions to show while someone types a new item name. */
export const MAX_DUPLICATE_SUGGESTIONS = 3;

/**
 * Cards rendered per page. Paging is client-side over the already-loaded
 * snapshot, so this bounds DOM size and scroll length, not network traffic —
 * "load more" still works with the connection off.
 */
export const AIRDROP_PAGE_SIZE = 8;
