import { DropPointEditor } from "@/components/drop-points/drop-point-editor";

/**
 * Volunteer drop-point editor. Static shell like every other page — the editor
 * loads client-side and is gated server-side, so an unauthorised visitor gets
 * the denied state rather than any address data.
 */
export default function DropPointsPage() {
  return (
    <>
      <header className="bg-header-bg border-border-structure border-b-2">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <h1 className="text-fg font-display text-base leading-tight uppercase sm:text-lg">
            Drop points
          </h1>
          <p className="text-fg-muted text-xs">
            Set the address supporters send airdrops to.
          </p>
        </div>
      </header>
      <main id="airdrop-board" className="flex-1">
        <DropPointEditor />
      </main>
    </>
  );
}
