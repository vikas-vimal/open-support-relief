import { ModerationConsole } from "@/components/moderation/moderation-console";

/**
 * Moderator review page. Static shell like every other page — the queues load
 * client-side and are gated server-side, so an unauthorised visitor gets the
 * denied state rather than any data.
 */
export default function ModeratePage() {
  return (
    <>
      <header className="bg-header-bg border-border-structure border-b-2">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <h1 className="text-fg font-display text-base leading-tight uppercase sm:text-lg">
            Review queue
          </h1>
          <p className="text-fg-muted text-xs">
            Verify airdrop claims and decide on proposed items.
          </p>
        </div>
      </header>
      <main id="airdrop-board" className="flex-1">
        <ModerationConsole />
      </main>
    </>
  );
}
