"use client";

import { useState } from "react";

import { appConfig } from "@/config/app.config";
import { createAirdropCardFile } from "@/lib/client/airdrop-card";
import { shareImage } from "@/lib/client/share";
import { buildAirdropShareText } from "@/lib/domain/share.util";

interface AirdropShareButtonProps {
  qty: number;
  unit: string;
  itemName: string;
}

/**
 * Generates the story-sized card for one airdrop and shares it (Web Share files
 * where supported, download otherwise). The card carries only what was sent and
 * the brand — never where — see `createAirdropCardFile`.
 */
export function AirdropShareButton({
  qty,
  unit,
  itemName,
}: AirdropShareButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleShare(): Promise<void> {
    setBusy(true);
    try {
      const file = await createAirdropCardFile({ qty, unit, itemName });
      const fallback = buildAirdropShareText(
        {
          qty,
          unit,
          itemName,
          brandName: appConfig.brand.name,
          tagline: appConfig.brand.tagline,
        },
        window.location.origin,
      );
      await shareImage(file, fallback);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      disabled={busy}
      className="border-border-strong text-fg self-start border-2 bg-surface px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
    >
      {busy ? "Preparing…" : `${appConfig.copy.shareCta} card 🪂`}
    </button>
  );
}
