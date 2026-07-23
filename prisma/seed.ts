import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { normalizeItemName } from "../lib/domain/item-match.util";
import { buildMockBoardSnapshot } from "../lib/mock/needs.mock";

/**
 * Seeds one active site plus the demo board.
 *
 * Reuses the exact fixture the UI was built against, so a freshly seeded
 * database renders identically to the mock. Idempotent: safe to re-run.
 *
 * Run with `prisma db seed` (configured in prisma.config.ts). Uses DIRECT_URL —
 * the seed runs DDL-adjacent work through the session pooler, not pgbouncer.
 */
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const snapshot = buildMockBoardSnapshot(new Date());

  const site = await prisma.site.upsert({
    where: { id: snapshot.site.id },
    update: { name: snapshot.site.name, areaLabel: snapshot.site.areaLabel },
    create: {
      id: snapshot.site.id,
      name: snapshot.site.name,
      areaLabel: snapshot.site.areaLabel,
      isActive: true,
    },
  });

  await prisma.dropPoint.upsert({
    where: { id: "dp_seed_gate3" },
    update: {},
    create: {
      id: "dp_seed_gate3",
      siteId: site.id,
      label: "Gate 3 medical tent",
      fullAddress: "REPLACE ME — real drop address goes here",
      recipientName: "REPLACE ME",
      recipientPhone: "REPLACE ME",
      instructions: "Ask for the volunteer coordinator.",
    },
  });

  for (const need of snapshot.needs) {
    const item = await prisma.supplyItem.upsert({
      where: { name: need.itemName },
      update: { unit: need.unit, category: need.category },
      create: {
        name: need.itemName,
        normalized: normalizeItemName(need.itemName),
        unit: need.unit,
        category: need.category,
      },
    });

    await prisma.need.upsert({
      where: { siteId_itemId: { siteId: site.id, itemId: item.id } },
      update: {
        qtyRequested: need.qtyRequested,
        qtyFulfilled: need.qtyFulfilled,
        qtyReserved: need.qtyReserved,
        urgency: need.urgency,
      },
      create: {
        siteId: site.id,
        itemId: item.id,
        qtyRequested: need.qtyRequested,
        qtyFulfilled: need.qtyFulfilled,
        qtyReserved: need.qtyReserved,
        urgency: need.urgency,
      },
    });
  }

  process.stdout.write(
    `Seeded site "${site.name}" with ${snapshot.needs.length} needs.\n`,
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`Seed failed: ${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
