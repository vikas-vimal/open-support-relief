"use client";

import { useEffect, useState } from "react";

import {
  DropPointAdminError,
  createDropPoint,
  fetchManagedDropPoints,
  updateDropPoint,
} from "@/lib/api/drop-point-admin.client";
import type { ManagedDropPoint } from "@/lib/api/schemas/drop-point-admin.schema";
import {
  DropPointForm,
  type DropPointFormValues,
} from "@/components/drop-points/drop-point-form";

type LoadState = "loading" | "ready" | "denied" | "error";

/**
 * Volunteer editor for the active site's drop points.
 *
 * Loads the gated address detail (VOLUNTEER-gated fetch, never cached) and lets
 * a volunteer correct it — the seed ships a "REPLACE ME" placeholder, so until
 * this is filled in the reveal flow hands out nothing usable. A non-volunteer
 * gets the denied state, never the data.
 */
export function DropPointEditor() {
  const [state, setState] = useState<LoadState>("loading");
  const [siteName, setSiteName] = useState("");
  const [dropPoints, setDropPoints] = useState<ManagedDropPoint[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchManagedDropPoints()
      .then((result) => {
        if (!alive) return;
        setSiteName(result.siteName);
        setDropPoints(result.dropPoints);
        setState("ready");
      })
      .catch((error) => {
        if (!alive) return;
        // 401 (no session) and 403 (wrong role) both mean "you can't see this" —
        // show the clean gate, not a load error.
        const gated =
          error instanceof DropPointAdminError &&
          (error.status === 401 || error.status === 403);
        setState(gated ? "denied" : "error");
      });
    return () => {
      alive = false;
    };
  }, []);

  async function saveExisting(
    id: string,
    values: DropPointFormValues,
  ): Promise<void> {
    const updated = await updateDropPoint(id, values);
    setDropPoints((current) =>
      current.map((point) => (point.id === id ? updated : point)),
    );
  }

  async function saveNew(values: DropPointFormValues): Promise<void> {
    const created = await createDropPoint(values);
    setDropPoints((current) => [...current, created]);
    setAdding(false);
  }

  if (state === "loading") {
    return <p className="text-fg-muted p-6 text-sm">Loading drop points…</p>;
  }
  if (state === "denied") {
    return (
      <p className="text-fg p-6 text-sm font-semibold">
        This page is for volunteers only.
      </p>
    );
  }
  if (state === "error") {
    return (
      <p className="text-danger p-6 text-sm">Could not load drop points.</p>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <p className="text-fg-muted text-xs">
        Editing drop points for <span className="text-fg font-semibold">{siteName}</span>.
        Addresses here are private and only revealed to signed-in supporters.
      </p>

      {dropPoints.map((point) => (
        <section
          key={point.id}
          className="border-border-structure bg-surface shadow-poster flex flex-col gap-3 border-2 p-4"
        >
          <h2 className="text-fg font-display text-base uppercase">
            {point.label}
            {!point.isActive && (
              <span className="text-fg-muted ml-2 text-xs font-semibold normal-case">
                (hidden)
              </span>
            )}
          </h2>
          <DropPointForm
            initial={point}
            submitLabel="Save changes"
            onSubmit={(values) => saveExisting(point.id, values)}
          />
        </section>
      ))}

      {adding ? (
        <section className="border-border-structure bg-surface shadow-poster flex flex-col gap-3 border-2 p-4">
          <h2 className="text-fg font-display text-base uppercase">
            New drop point
          </h2>
          <DropPointForm submitLabel="Create drop point" onSubmit={saveNew} />
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="border-border-strong text-fg border-2 border-dashed bg-surface px-4 py-3 text-sm font-semibold"
        >
          + Add a drop point
        </button>
      )}
    </div>
  );
}
