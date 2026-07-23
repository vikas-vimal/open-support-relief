import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton, connected through the pg driver adapter (Prisma 7).
 *
 * Runtime uses DATABASE_URL — the pgbouncer transaction pooler. The adapter owns
 * the connection pool, so it is created once per process and reused. In dev,
 * Next's hot reload re-evaluates modules, so the instance is stashed on
 * `globalThis` to avoid exhausting Postgres connections with a new pool per edit.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set — cannot create the Prisma client. Copy .env.example to .env and fill it in.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
