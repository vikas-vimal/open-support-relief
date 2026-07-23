import { prisma } from "@/lib/db/prisma";

/**
 * Moves an anonymous user's data onto the account they just signed into (§17.7).
 *
 * Called from better-auth's `onLinkAccount` when an anonymous supporter upgrades
 * to Google, BEFORE the anonymous row is deleted — so a first-time anonymous
 * sender keeps everything: their contributions (with receiver codes and any
 * dispute state, since those are columns on the moved rows), their item
 * requests, and their wall opt-in / display name. Kept as one transaction so an
 * upgrade never half-migrates.
 */
export async function migrateAnonymousData(
  anonymousId: string,
  newId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.contribution.updateMany({
      where: { userId: anonymousId },
      data: { userId: newId },
    });
    await tx.itemRequest.updateMany({
      where: { requestedById: anonymousId },
      data: { requestedById: newId },
    });

    // Carry the wall opt-in and display name only if the anonymous user had one,
    // and never clobber a name the new account already set.
    const anon = await tx.user.findUnique({
      where: { id: anonymousId },
      select: { showOnWall: true, displayName: true },
    });
    if (anon?.showOnWall || anon?.displayName) {
      const current = await tx.user.findUnique({
        where: { id: newId },
        select: { showOnWall: true, displayName: true },
      });
      await tx.user.update({
        where: { id: newId },
        data: {
          showOnWall: Boolean(current?.showOnWall) || anon.showOnWall,
          displayName: current?.displayName ?? anon.displayName,
        },
      });
    }
  });
}
