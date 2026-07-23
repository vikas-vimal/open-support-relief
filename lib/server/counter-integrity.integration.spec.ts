import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { claimContribution, OversellError } from "@/lib/server/contribution.service";
import {
  ContributionNotPendingError,
  reviewContribution,
} from "@/lib/server/moderation.service";

/**
 * The counters ARE the product — a wrong one makes people double-buy or stop
 * buying. These exercise the real transactional services against a real
 * database, so they need one: run with
 *
 *   INTEGRATION_DB=1 npx vitest run lib/server/counter-integrity.integration.spec.ts
 *
 * They are skipped by default so the ordinary unit run stays DB-free. Each test
 * resets the shared throwaway need, so they are order-independent.
 */

const RUN = !!process.env.INTEGRATION_DB;
const NEED_TARGET = 20;
const stamp = Date.now();

describe.skipIf(!RUN)("counter integrity (DB)", () => {
  let userId: string;
  let itemId: string;
  let needId: string;

  beforeAll(async () => {
    const site = await prisma.site.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (!site) throw new Error("No active site for the integration test");

    const user = await prisma.user.create({
      data: { name: "zzci", email: `zzci.${stamp}@zz.test` },
    });
    userId = user.id;

    const item = await prisma.supplyItem.create({
      data: {
        name: `ZZ CI Item ${stamp}`,
        normalized: `zz ci item ${stamp}`,
        unit: "piece",
        category: "SAFETY",
      },
    });
    itemId = item.id;

    const need = await prisma.need.create({
      data: { siteId: site.id, itemId: item.id, qtyRequested: NEED_TARGET },
    });
    needId = need.id;
  });

  beforeEach(async () => {
    await prisma.contribution.deleteMany({ where: { needId } });
    await prisma.needEvent.deleteMany({ where: { needId } });
    await prisma.intent.deleteMany({ where: { needId } });
    await prisma.need.update({
      where: { id: needId },
      data: { qtyFulfilled: 0, qtyReserved: 0 },
    });
  });

  afterAll(async () => {
    await prisma.contribution.deleteMany({ where: { needId } });
    await prisma.needEvent.deleteMany({ where: { needId } });
    await prisma.intent.deleteMany({ where: { needId } });
    await prisma.need.delete({ where: { id: needId } }).catch(() => {});
    await prisma.supplyItem.delete({ where: { id: itemId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  async function currentFulfilled(): Promise<number> {
    const need = await prisma.need.findUnique({ where: { id: needId } });
    return need?.qtyFulfilled ?? -1;
  }

  const claim = (key: string, qty: number) =>
    claimContribution(userId, key, {
      needId,
      qty,
      platform: "BLINKIT",
      showName: false,
    });

  it("a claim increments the counter by exactly the claimed quantity", async () => {
    const result = await claim(`ci-a-${stamp}`, 5);
    expect(result.qtyFulfilled).toBe(5);
    expect(await currentFulfilled()).toBe(5);
  });

  it("replaying an idempotency key is a no-op, never a double count", async () => {
    const key = `ci-idem-${stamp}`;
    const first = await claim(key, 5);
    expect(first.deduplicated).toBe(false);

    const replay = await claim(key, 5);
    expect(replay.deduplicated).toBe(true);
    expect(replay.contributionId).toBe(first.contributionId);
    expect(await currentFulfilled()).toBe(5);
  });

  it("a claim that would oversell is rejected and leaves the counter untouched", async () => {
    await claim(`ci-b-${stamp}`, 5);
    await expect(claim(`ci-over-${stamp}`, NEED_TARGET)).rejects.toBeInstanceOf(
      OversellError,
    ); // 5 + 20 > 20
    expect(await currentFulfilled()).toBe(5);
  });

  it("rejecting a claim restores the counter exactly", async () => {
    const made = await claim(`ci-c-${stamp}`, 8);
    expect(await currentFulfilled()).toBe(8);

    const review = await reviewContribution(userId, made.contributionId, "REJECT");
    expect(review.state).toBe("REJECTED");
    expect(await currentFulfilled()).toBe(0);
  });

  it("a second review of the same claim is refused", async () => {
    const made = await claim(`ci-d-${stamp}`, 4);
    await reviewContribution(userId, made.contributionId, "VERIFY");
    await expect(
      reviewContribution(userId, made.contributionId, "REJECT"),
    ).rejects.toBeInstanceOf(ContributionNotPendingError);
    // VERIFY keeps the count; the refused second review must not change it.
    expect(await currentFulfilled()).toBe(4);
  });
});
