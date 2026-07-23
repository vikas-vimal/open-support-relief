"use client";

import { PosterButton } from "@/components/ui/poster-button";
import { AirdropMeter } from "@/components/ui/airdrop-meter";
import { UrgencyStamp } from "@/components/ui/urgency-stamp";
import { appConfig } from "@/config/app.config";
import { shareContent } from "@/lib/client/share";
import {
  formatCompactQuantity,
  formatQuantity,
} from "@/lib/domain/format.util";
import { buildNeedShareText } from "@/lib/domain/share.util";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { NeedSummary } from "@/lib/domain/airdrop.types";

interface NeedCardProps {
  need: NeedSummary;
  onContribute: (need: NeedSummary) => void;
}

export function NeedCard({ need, onContribute }: NeedCardProps) {
  const { t } = useI18n();
  const isSatisfied = need.shortfall === 0;

  function handleShare(): void {
    const content = buildNeedShareText(
      {
        itemName: need.itemName,
        shortfall: need.shortfall,
        unit: need.unit,
        brandName: appConfig.brand.name,
        tagline: appConfig.brand.tagline,
      },
      window.location.origin,
    );
    void shareContent(content);
  }

  return (
    <article className="border-border-structure bg-surface flex flex-col gap-3 rounded-card border-2 p-4 shadow-poster">
      <header className="flex items-start justify-between gap-3">
        <h3 className="text-fg font-display text-lg leading-tight tracking-tight uppercase">
          {need.itemName}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <UrgencyStamp urgency={need.urgency} />
          <button
            type="button"
            onClick={handleShare}
            aria-label={t("aria.share", { item: need.itemName })}
            title={t("cta.share")}
            className="border-border-strong bg-surface text-fg flex size-8 items-center justify-center rounded-icon border-2 text-sm leading-none"
          >
            <span aria-hidden="true">🔗</span>
          </button>
        </div>
      </header>

      <AirdropMeter
        itemName={need.itemName}
        unit={need.unit}
        qtyRequested={need.qtyRequested}
        qtyFulfilled={need.qtyFulfilled}
        qtyReserved={need.qtyReserved}
      />

      {isSatisfied ? (
        <p className="label-track border-success text-success rounded-card border-2 px-3 py-2 text-center text-xs">
          {t("card.fullyCovered")}
        </p>
      ) : (
        /* Two columns: the shortfall carries the urgency, the button carries
           the action. Stacks below 360px so neither gets squeezed. */
        <div className="flex flex-col gap-3 min-[360px]:flex-row min-[360px]:items-center">
          <div className="flex shrink-0 flex-col gap-1.5 min-[360px]:min-w-[6.5rem]">
            <div>
              {/* Compact here ONLY. The meter line above and the progressbar's
                  aria-label both keep the exact figure — this is the one place
                  a six-digit shortfall would break the layout. */}
              <p
                className="text-fg font-display text-2xl leading-none"
                title={`${formatQuantity(need.shortfall)} ${need.unit}`}
              >
                {formatCompactQuantity(need.shortfall)}
              </p>
              <p className="text-fg-muted mt-1 text-[0.6875rem] font-semibold">
                {t("label.stillNeeded")}
              </p>
            </div>

            {need.activeContributorCount > 0 && (
              <p className="bg-live inline-flex items-center gap-1.5 self-start rounded-pill px-2.5 py-1 text-[0.6875rem] font-semibold text-white">
                <span
                  aria-hidden="true"
                  className="inline-block size-1.5 shrink-0 rounded-full bg-white"
                />
                {need.activeContributorCount === 1
                  ? t("card.orderingNowOne")
                  : t("card.orderingNow", {
                      count: need.activeContributorCount,
                    })}
              </p>
            )}
          </div>

          <PosterButton size="lg" onClick={() => onContribute(need)}>
            {t("cta.contribute")}
          </PosterButton>
        </div>
      )}
    </article>
  );
}
