import { describe, expect, it } from "vitest";

import { boardSnapshotSchema } from "./board.schema";
import { contributorWallSchema } from "./contributor-wall.schema";
import { pulseSchema } from "./pulse.schema";
import { revealResponseSchema } from "./reveal.schema";
import { siteListResponseSchema } from "./sites.schema";

/**
 * The board's whole safety model is that a drop-point address lives behind the
 * login-gated reveal and NOWHERE else (§7). These schemas are the last line: a
 * route parses its own output through them before responding, so even if a
 * service accidentally selected an address, the public schema must drop it.
 *
 * Zod object schemas strip unknown keys by construction — this proves that
 * property holds for every public payload, and that the reveal schema is the one
 * deliberate exception.
 */

const FORBIDDEN = /address|phone|recipient/i;

function deepKeys(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) deepKeys(item, out);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      out.push(key);
      deepKeys(child, out);
    }
  }
  return out;
}

describe("public payloads never carry an address or phone", () => {
  it("board snapshot strips injected address fields", () => {
    const parsed = boardSnapshotSchema.parse({
      site: {
        id: "s1",
        name: "Site",
        areaLabel: "Near a landmark",
        isFrozen: false,
        // Attempts to smuggle gated data through the public board:
        fullAddress: "42 Secret Marg",
        recipientPhone: "+91 90000 00000",
        dropPoints: [
          { id: "d1", label: "Gate 3", fullAddress: "42 Secret Marg" },
        ],
      },
      needs: [],
    });
    expect(deepKeys(parsed).filter((k) => FORBIDDEN.test(k))).toEqual([]);
  });

  it.each([
    [
      "sites",
      () =>
        siteListResponseSchema.parse({
          sites: [
            {
              id: "s1",
              name: "Site",
              areaLabel: "Near a landmark",
              recipientPhone: "+91 90000 00000",
            },
          ],
        }),
    ],
    [
      "pulse",
      () =>
        pulseSchema.parse({
          itemsAllTime: 1,
          itemsLast24h: 1,
          airdropsAllTime: 1,
          fullAddress: "42 Secret Marg",
        }),
    ],
    [
      "contributor wall",
      () =>
        contributorWallSchema.parse({
          leaders: [
            {
              displayName: "Priya",
              verifiedQty: 5,
              verifiedCount: 1,
              recipientPhone: "+91 90000 00000",
            },
          ],
          anonymousSupporterCount: 0,
          anonymousQty: 0,
        }),
    ],
  ])("%s payload strips injected address fields", (_label, build) => {
    expect(deepKeys(build()).filter((k) => FORBIDDEN.test(k))).toEqual([]);
  });

  it("the reveal payload is the ONE place that carries the address", () => {
    const parsed = revealResponseSchema.parse({
      dropPointId: "d1",
      label: "Gate 3",
      fullAddress: "42 Real Marg",
      recipientName: "Coordinator",
      recipientPhone: "+91 90000 00000",
      instructions: null,
      remaining: 9,
    });
    expect(parsed.fullAddress).toBe("42 Real Marg");
    expect(parsed.recipientPhone).toBe("+91 90000 00000");
  });
});
