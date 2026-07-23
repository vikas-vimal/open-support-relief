import { VolunteerConsole } from "@/components/volunteer/volunteer-console";

/**
 * Volunteer board console. Static shell like every page — the editor loads
 * client-side and is gated server-side, so an unauthorised visitor gets the
 * denied state rather than any data.
 */
export default function VolunteerPage() {
  return (
    <>
      <header className="bg-header-bg border-border-structure border-b-2">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <h1 className="text-fg font-display text-base leading-tight uppercase sm:text-lg">
            Board console
          </h1>
          <p className="text-fg-muted text-xs">
            Post needs, adjust quantities, stop what is oversupplied.
          </p>
        </div>
      </header>
      <main id="airdrop-board" className="flex-1">
        <VolunteerConsole />
      </main>
    </>
  );
}
