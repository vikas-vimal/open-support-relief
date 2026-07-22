import {
  DUPLICATE_MATCH_THRESHOLD,
  MAX_DUPLICATE_SUGGESTIONS,
} from "./airdrop.constants";
import type { NeedSummary } from "./airdrop.types";

/**
 * Item-name matching, shared by the search bar and the duplicate guard on the
 * "request an item" sheet.
 *
 * Both surfaces MUST use the same matcher: if search finds "Raincoats" but the
 * duplicate check does not, someone searches, sees nothing, and proposes a
 * duplicate — which is precisely the failure this is here to prevent.
 *
 * Runs entirely against the already-loaded board, so it costs no network and
 * keeps working offline.
 */

export interface NeedMatch {
  need: NeedSummary;
  /** 0–1. 1 is an exact normalized match. */
  score: number;
}

const PUNCTUATION = /[^\p{L}\p{N}\s]/gu;
const WHITESPACE = /\s+/g;

/**
 * Lowercase, strip punctuation, collapse whitespace, and naively de-pluralise
 * each token so "Raincoats", "raincoat" and "RAIN-COATS " converge.
 *
 * Deliberately naive: an English stemmer is far more machinery than an airdrop
 * list of a few dozen short nouns justifies, and over-stemming would collide
 * distinct items.
 */
export function normalizeItemName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(PUNCTUATION, " ")
    .replace(WHITESPACE, " ")
    .trim()
    .split(" ")
    .map(depluralize)
    .join(" ");
}

function depluralize(token: string): string {
  // Too short to safely strip — "gas" must not become "ga".
  if (token.length <= 3) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.endsWith("ses") || token.endsWith("xes") || token.endsWith("hes")) {
    return token.slice(0, -2);
  }
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

function tokenize(normalized: string): string[] {
  return normalized.split(" ").filter(Boolean);
}

/**
 * Similarity between a query and a candidate item name, 0–1.
 *
 * Ordered by confidence: exact match, then whole-phrase containment, then
 * token overlap. Token overlap is scaled by how much of the *query* was
 * matched, so typing "water" against "Water Bottles (1L)" scores highly rather
 * than being penalised for the candidate's extra words.
 */
export function scoreNameSimilarity(query: string, candidate: string): number {
  const normalizedQuery = normalizeItemName(query);
  const normalizedCandidate = normalizeItemName(candidate);

  if (!normalizedQuery || !normalizedCandidate) return 0;
  if (normalizedQuery === normalizedCandidate) return 1;

  /* Compare with spaces removed too. "rain-coat", "rain coat" and "raincoat"
     are the same item to a human, but tokenising alone scores them 0 — which
     would let a hyphenated spelling slip straight past the duplicate guard. */
  const collapsedQuery = normalizedQuery.replaceAll(" ", "");
  const collapsedCandidate = normalizedCandidate.replaceAll(" ", "");
  if (collapsedQuery === collapsedCandidate) return 0.95;

  if (collapsedCandidate.includes(collapsedQuery)) {
    // Longer queries are stronger evidence than a one-letter prefix.
    return 0.6 + 0.3 * (collapsedQuery.length / collapsedCandidate.length);
  }
  if (collapsedQuery.includes(collapsedCandidate)) return 0.75;

  const queryTokens = tokenize(normalizedQuery);
  const candidateTokens = new Set(tokenize(normalizedCandidate));
  if (queryTokens.length === 0) return 0;

  const overlap = queryTokens.filter((token) =>
    candidateTokens.has(token),
  ).length;

  return overlap === 0 ? 0 : (overlap / queryTokens.length) * 0.7;
}

/** Every need scoring above zero, best first. Powers the search results list. */
export function findSimilarNeeds(
  query: string,
  needs: readonly NeedSummary[],
): NeedMatch[] {
  if (!query.trim()) return [];

  return needs
    .map((need) => ({ need, score: scoreNameSimilarity(query, need.itemName) }))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score);
}

/**
 * Only the matches confident enough to warn about before accepting a new-item
 * proposal. Capped so the sheet cannot push its own form off-screen.
 */
export function findLikelyDuplicates(
  query: string,
  needs: readonly NeedSummary[],
): NeedMatch[] {
  return findSimilarNeeds(query, needs)
    .filter((match) => match.score >= DUPLICATE_MATCH_THRESHOLD)
    .slice(0, MAX_DUPLICATE_SUGGESTIONS);
}
