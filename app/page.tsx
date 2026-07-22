import { AirdropBoard } from "@/components/board/airdrop-board";

/**
 * Static shell only — no per-request rendering and no server data fetching.
 * Next.js prerenders this at build time, so the HTML is a plain CDN asset that
 * paints immediately on a slow connection; the board hydrates and fetches after.
 */
export default function BoardPage() {
  return <AirdropBoard />;
}
