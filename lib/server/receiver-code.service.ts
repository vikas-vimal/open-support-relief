import { prisma } from "@/lib/db/prisma";
import { generateReceiverCode } from "@/lib/domain/receiver-code.util";

const MAX_ATTEMPTS = 5;

/**
 * Issues a receiver code not already used by a contribution.
 *
 * The code is shown to the supporter at reveal and must match what the
 * contribution eventually stores, so it is checked for freeness here rather than
 * only relying on the unique constraint at insert. Five straight collisions is
 * statistically impossible across a ~29^8 space, so exhausting them signals a
 * real fault, not a busy table.
 */
export async function issueUniqueReceiverCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = generateReceiverCode();
    const existing = await prisma.contribution.findUnique({
      where: { receiverCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Could not issue a unique receiver code");
}
