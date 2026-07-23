"use client";

import { useEffect, useState } from "react";

import { AddNeedForm } from "@/components/volunteer/add-need-form";
import { NeedEditorRow } from "@/components/volunteer/need-editor-row";
import {
  fetchManagedNeeds,
  NeedsAdminError,
  type ManagedNeedsData,
} from "@/lib/api/needs-admin.client";
import type { ManagedNeed } from "@/lib/api/schemas/needs-admin.schema";

type LoadState = "loading" | "ready" | "denied" | "error";

/**
 * Volunteer board editor: post needs, adjust quantities/urgency, and STOP items
 * that are oversupplied. Gated server-side (VOLUNTEER+), so a non-volunteer sees
 * the denied state, never the data. English-only, like the other operator
 * consoles — a volunteer must not have to decode a translated control mid-shift.
 */
export function VolunteerConsole() {
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<ManagedNeedsData | null>(null);

  useEffect(() => {
    let alive = true;
    fetchManagedNeeds()
      .then((result) => {
        if (!alive) return;
        setData(result);
        setState("ready");
      })
      .catch((error) => {
        if (!alive) return;
        const gated =
          error instanceof NeedsAdminError &&
          (error.status === 401 || error.status === 403);
        setState(gated ? "denied" : "error");
      });
    return () => {
      alive = false;
    };
  }, []);

  function upsertNeed(next: ManagedNeed): void {
    setData((current) => {
      if (!current) return current;
      const exists = current.needs.some((need) => need.id === next.id);
      const needs = exists
        ? current.needs.map((need) => (need.id === next.id ? next : need))
        : [next, ...current.needs];
      return { ...current, needs };
    });
  }

  if (state === "loading") {
    return <p className="text-fg-muted p-6 text-sm">Loading needs…</p>;
  }
  if (state === "denied") {
    return (
      <p className="text-fg p-6 text-sm font-semibold">
        This page is for volunteers only.
      </p>
    );
  }
  if (state === "error" || !data) {
    return <p className="text-danger p-6 text-sm">Could not load needs.</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <p className="text-fg-muted text-xs">
        Editing the board for{" "}
        <span className="text-fg font-semibold">{data.siteName}</span>.
      </p>

      <AddNeedForm catalogue={data.catalogue} onAdded={upsertNeed} />

      <ul className="flex list-none flex-col gap-3">
        {data.needs.map((need) => (
          <NeedEditorRow key={need.id} need={need} onChanged={upsertNeed} />
        ))}
      </ul>
    </div>
  );
}
