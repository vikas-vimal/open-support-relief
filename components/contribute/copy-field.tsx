"use client";

import { useState } from "react";

import { useI18n } from "@/lib/i18n/use-i18n";

interface CopyFieldProps {
  label: string;
  value: string;
  /** Optional tel:/https: action shown as a second button. */
  action?: { href: string; label: string };
}

/**
 * A labelled value with a one-tap Copy button.
 *
 * "Copy address" is the single most important control in the app — the delivery
 * apps can't be handed an address, so the contributor pastes it themselves. The
 * copied state is transient UI only; the value is never stored anywhere.
 */
export function CopyField({ label, value, action }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / permissions) — the value is still
      // visible on screen to copy by hand, so this fails quietly.
    }
  }

  return (
    <div className="flex flex-col gap-1 border-2 border-border-structure bg-surface-2 p-3">
      <span className="label-track text-[0.625rem] text-fg-muted">{label}</span>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 text-sm font-semibold break-words text-fg">
          {value}
        </span>
        <div className="flex shrink-0 gap-1.5">
          {action && (
            <a
              href={action.href}
              className="border-2 border-border-strong bg-surface px-2.5 py-1 text-xs font-semibold text-fg"
            >
              {action.label}
            </a>
          )}
          <button
            type="button"
            onClick={copy}
            aria-label={t("copy.copyAria", { label })}
            className="border-2 border-border-strong bg-primary px-2.5 py-1 text-xs font-semibold text-brand-ink"
          >
            {copied ? t("copy.copied") : t("copy.copy")}
          </button>
        </div>
      </div>
    </div>
  );
}
