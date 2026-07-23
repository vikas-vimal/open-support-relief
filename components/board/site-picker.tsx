"use client";

import type { SiteListItem } from "@/lib/api/schemas/sites.schema";
import { useI18n } from "@/lib/i18n/use-i18n";

interface SitePickerProps {
  sites: readonly SiteListItem[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

/**
 * Site switcher — the ONE place the app admits more than one site exists.
 *
 * Renders nothing for a single site (the whole product is single-site until a
 * second one is added), so this is a no-op on the current deployment and only
 * lights up when `/api/sites` returns more than one active site. Site names
 * come from the database, so they are not translated.
 */
export function SitePicker({ sites, selectedId, onSelect }: SitePickerProps) {
  const { t } = useI18n();
  if (sites.length <= 1) return null;

  return (
    <div
      role="radiogroup"
      aria-label={t("aria.chooseSite")}
      className="border-border-soft mx-auto flex max-w-3xl gap-2 overflow-x-auto border-b-2 px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {sites.map((site) => {
        const selected = site.id === selectedId;
        return (
          <button
            key={site.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(site.id)}
            className={`border-border-strong shrink-0 rounded-pill border-2 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
              selected ? "bg-fg text-canvas" : "bg-surface text-fg"
            }`}
          >
            {site.name}
          </button>
        );
      })}
    </div>
  );
}
