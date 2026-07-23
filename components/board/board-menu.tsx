"use client";

import Link from "next/link";
import { useRef } from "react";

import { authClient, useSession } from "@/lib/auth/auth-client";
import { useTheme } from "@/lib/hooks/use-theme";
import { LOCALE_LABEL, LOCALES } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/use-i18n";

const VOLUNTEER_ROLES = ["VOLUNTEER", "MODERATOR", "ADMIN"];
const MODERATOR_ROLES = ["MODERATOR", "ADMIN"];

const ROW =
  "border-border-strong bg-surface text-fg flex w-full items-center justify-between gap-2 border-2 px-4 py-3 text-sm font-semibold";

/**
 * The single entry point that replaced the header icon buttons: theme, language,
 * navigation, and sign-in/out, adapted to who is here.
 *
 * A native <dialog> sheet (focus trap, Escape, backdrop) — the same primitive as
 * the contribute sheet. Role comes from the session, so "Moderator sign-in" hides
 * once someone is signed in, and the console links only appear for the roles that
 * can use them.
 */
export function BoardMenu() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t, locale, setLocale, ready } = useI18n();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { data: session } = useSession();

  const user = session?.user as
    | (NonNullable<typeof session>["user"] & {
        role?: string;
        isAnonymous?: boolean;
      })
    | undefined;
  const role = user?.role ?? "PUBLIC";
  const isAnonymous = user?.isAnonymous ?? true;
  // "Signed in" here means a real (Google) identity, not the anonymous default.
  const signedIn = Boolean(user) && !isAnonymous;
  const isVolunteer = VOLUNTEER_ROLES.includes(role);
  const isModerator = MODERATOR_ROLES.includes(role);

  function close(): void {
    dialogRef.current?.close();
  }

  async function signIn(callbackURL: string): Promise<void> {
    await authClient.signIn.social({ provider: "google", callbackURL });
  }

  async function signOut(): Promise<void> {
    await authClient.signOut();
    window.location.href = "/";
  }

  function setTheme(target: "light" | "dark"): void {
    if (resolvedTheme !== target) toggleTheme();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={t("menu.open")}
        className="border-border-strong bg-surface text-fg flex size-10 shrink-0 items-center justify-center rounded-icon border-2 text-lg leading-none"
      >
        <span aria-hidden="true">☰</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={t("menu.title")}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        className="rounded-t-card border-border-structure bg-surface text-fg backdrop:bg-fg/60 m-0 mt-auto max-h-[88dvh] w-full max-w-md border-[3px] p-0 sm:mx-auto sm:my-auto sm:rounded-card"
      >
        <div className="flex max-h-[88dvh] flex-col gap-3 overflow-y-auto p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base text-fg uppercase">
              {t("menu.title")}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label={t("menu.close")}
              className="border-border-strong bg-surface text-fg flex size-8 items-center justify-center rounded-icon border-2 text-sm leading-none"
            >
              ✕
            </button>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-fg-muted text-xs font-semibold uppercase">
              {t("menu.theme")}
            </span>
            <div className="flex gap-1.5">
              {(["light", "dark"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={resolvedTheme === option}
                  onClick={() => setTheme(option)}
                  className={`border-border-strong rounded-pill border-2 px-3 py-1.5 text-xs font-semibold ${
                    resolvedTheme === option
                      ? "bg-fg text-canvas"
                      : "bg-surface text-fg"
                  }`}
                >
                  {t(option === "dark" ? "menu.dark" : "menu.light")}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-fg-muted text-xs font-semibold uppercase">
              {t("menu.language")}
            </span>
            <div className="flex gap-1.5">
              {LOCALES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={ready && locale === option}
                  onClick={() => setLocale(option)}
                  className={`border-border-strong rounded-pill border-2 px-3 py-1.5 text-xs font-semibold ${
                    ready && locale === option
                      ? "bg-fg text-canvas"
                      : "bg-surface text-fg"
                  }`}
                >
                  {LOCALE_LABEL[option]}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-border-soft" />

          <Link href="/wall" onClick={close} className={ROW}>
            <span>🏆 {t("aria.wall")}</span>
          </Link>
          <Link href="/my-airdrops" onClick={close} className={ROW}>
            <span>🧾 {t("aria.myAirdrops")}</span>
          </Link>

          {isModerator && (
            <Link href="/moderate" onClick={close} className={ROW}>
              <span>🛡️ {t("menu.reviewQueue")}</span>
            </Link>
          )}
          {isVolunteer && (
            <Link href="/volunteer" onClick={close} className={ROW}>
              <span>📋 {t("menu.boardConsole")}</span>
            </Link>
          )}

          <hr className="border-border-soft" />

          {signedIn ? (
            <button type="button" onClick={() => void signOut()} className={ROW}>
              <span>{t("menu.signOut")}</span>
            </button>
          ) : (
            <>
              <p className="text-fg-muted text-[0.6875rem] leading-relaxed">
                {t("menu.deviceOnly")}
              </p>
              <button
                type="button"
                onClick={() => void signIn("/my-airdrops")}
                className="border-border-strong bg-primary text-brand-ink border-2 px-4 py-3 text-sm font-semibold"
              >
                {t("menu.signInSupporter")}
              </button>
              <button
                type="button"
                onClick={() => void signIn("/moderate")}
                className={ROW}
              >
                <span>{t("menu.moderatorSignIn")}</span>
              </button>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
