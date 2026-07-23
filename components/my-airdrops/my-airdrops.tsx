"use client";

import { useState } from "react";

import { AirdropShareButton } from "@/components/my-airdrops/airdrop-share-button";
import { DeleteAccountButton } from "@/components/my-airdrops/delete-account-button";
import { StatusBadge } from "@/components/my-airdrops/status-badge";
import { authClient, useSession } from "@/lib/auth/auth-client";
import { FULFILMENT_PLATFORM_LABEL } from "@/lib/domain/airdrop.constants";
import { formatQuantity } from "@/lib/domain/format.util";
import { formatRelativeTime } from "@/lib/domain/needs.util";
import { useMyContributions } from "@/lib/hooks/use-my-contributions";
import { useI18n } from "@/lib/i18n/use-i18n";

function platformName(platform: string, platformOther: string | null): string {
  if (platform === "OTHER" && platformOther) return platformOther;
  return (
    FULFILMENT_PLATFORM_LABEL[platform as keyof typeof FULFILMENT_PLATFORM_LABEL] ??
    platform
  );
}

/**
 * A supporter's own airdrop history, with each item's verification status.
 *
 * The default supporter is anonymous, so their history lives with a session
 * cookie on THIS device. The Google prompt is how they make it durable and
 * cross-device — and the onLinkAccount hook already carries their anonymous
 * airdrops onto the Google account, so nothing is lost on upgrade.
 */
export function MyAirdrops() {
  const { data: session } = useSession();
  const { data: contributions, isLoading, isError } = useMyContributions();
  const [signingIn, setSigningIn] = useState(false);
  const { t } = useI18n();

  const isAnonymous = session?.user
    ? ((session.user as { isAnonymous?: boolean }).isAnonymous ?? false)
    : true;

  async function signInWithGoogle(): Promise<void> {
    setSigningIn(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/my-airdrops",
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      {isAnonymous && (contributions?.length ?? 0) > 0 && (
        <div className="border-border-structure bg-surface-2 flex flex-col gap-2 border-2 p-4">
          <p className="text-sm font-semibold text-fg">{t("mine.deviceOnly")}</p>
          <p className="text-xs leading-relaxed text-fg-muted">
            {t("mine.deviceOnlyBody")}
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={signingIn}
            className="border-border-strong bg-primary text-brand-ink mt-1 border-2 px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {signingIn ? t("mine.redirecting") : t("mine.signIn")}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-fg-muted">{t("mine.loading")}</p>
      ) : isError ? (
        <p className="text-sm text-danger">{t("mine.error")}</p>
      ) : (contributions?.length ?? 0) === 0 ? (
        <div className="border-border-soft flex flex-col items-center gap-2 border-2 border-dashed p-8 text-center">
          <p className="text-2xl" aria-hidden="true">
            📦
          </p>
          <p className="text-sm font-semibold text-fg">{t("mine.emptyTitle")}</p>
          <p className="text-xs text-fg-muted">{t("mine.emptyBody")}</p>
        </div>
      ) : (
        <ul className="flex list-none flex-col gap-3">
          {contributions?.map((item) => (
            <li
              key={item.id}
              className="border-border-structure bg-surface flex flex-col gap-2 border-2 p-4 shadow-poster"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-base text-fg uppercase">
                  {formatQuantity(item.qtyClaimed)} {item.unit} · {item.itemName}
                </h2>
                <StatusBadge state={item.state} />
              </div>
              <p className="text-xs text-fg-muted">
                {t("mine.via", {
                  platform: platformName(item.platform, item.platformOther),
                })}{" "}
                · {formatRelativeTime(item.createdAt, new Date())}
                {item.state === "VERIFIED" &&
                  item.reviewedAt &&
                  ` · ${t("mine.confirmed", {
                    time: formatRelativeTime(item.reviewedAt, new Date()),
                  })}`}
              </p>
              {item.receiverCode && (
                <p className="text-fg-muted font-mono text-[0.6875rem]">
                  {t("mine.code", { code: item.receiverCode })}
                </p>
              )}
              <AirdropShareButton
                qty={item.qtyClaimed}
                unit={item.unit}
                itemName={item.itemName}
              />
            </li>
          ))}
        </ul>
      )}

      {session?.user && <DeleteAccountButton />}
    </div>
  );
}
