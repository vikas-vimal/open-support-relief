"use client";

import { useState } from "react";

import { useI18n } from "@/lib/i18n/use-i18n";

type State = "idle" | "confirming" | "deleting" | "error";

/**
 * One-tap account + data deletion (§7). Two taps, actually: the first arms the
 * confirm so a stray tap on a shared phone at a protest can't wipe someone's
 * history. On success the whole app reloads at "/" — the session is gone, so
 * everything re-renders as a fresh anonymous visitor.
 */
export function DeleteAccountButton() {
  const { t } = useI18n();
  const [state, setState] = useState<State>("idle");

  async function remove(): Promise<void> {
    setState("deleting");
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
      // Hard navigation clears all in-memory session/query state.
      window.location.href = "/";
    } catch {
      setState("error");
    }
  }

  return (
    <div className="border-border-soft mt-2 flex flex-col gap-2 border-t-2 border-dashed pt-4">
      <p className="text-fg text-xs font-semibold">{t("mine.deleteTitle")}</p>
      <p className="text-fg-muted text-[0.6875rem] leading-relaxed">
        {t("mine.deleteBody")}
      </p>
      <button
        type="button"
        disabled={state === "deleting"}
        onClick={() =>
          state === "confirming" ? void remove() : setState("confirming")
        }
        className="border-danger text-danger self-start border-2 bg-surface px-3 py-2 text-xs font-semibold disabled:opacity-60"
      >
        {state === "deleting"
          ? t("mine.deleting")
          : state === "confirming"
            ? t("mine.deleteConfirm")
            : t("mine.deleteButton")}
      </button>
      {state === "error" && (
        <p role="alert" className="text-danger text-[0.6875rem] font-semibold">
          {t("mine.deleteError")}
        </p>
      )}
    </div>
  );
}
