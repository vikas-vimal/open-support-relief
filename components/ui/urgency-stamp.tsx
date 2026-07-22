import { URGENCY, type Urgency } from "@/lib/domain/airdrop.constants";

interface UrgencyStampProps {
  urgency: Urgency;
}

/*
 * URGENT is FILLED, NEEDED is OUTLINED.
 *
 * The two were previously separated by hue alone (red vs orange), which at
 * 10px is close to indistinguishable and vanishes entirely for red-green
 * colour blindness. Fill-vs-outline is a shape difference, so it survives both.
 */
const STAMP_CLASSES: Readonly<Record<Urgency, string>> = {
  [URGENCY.URGENT]: "border-urgent bg-urgent text-white -rotate-6",
  [URGENCY.HIGH]: "border-warn text-warn -rotate-3",
  [URGENCY.NORMAL]: "",
};

const STAMP_LABEL: Readonly<Record<Urgency, string>> = {
  [URGENCY.URGENT]: "Urgent",
  [URGENCY.HIGH]: "Needed",
  [URGENCY.NORMAL]: "",
};

/** Rubber-stamp badge. Renders nothing at NORMAL — a stamp on everything is a stamp on nothing. */
export function UrgencyStamp({ urgency }: UrgencyStampProps) {
  if (urgency === URGENCY.NORMAL) return null;

  return (
    <span
      className={`label-track-wide shrink-0 rounded-card border-2 px-2 py-1 text-[0.625rem] leading-none ${STAMP_CLASSES[urgency]}`}
    >
      {STAMP_LABEL[urgency]}
    </span>
  );
}
