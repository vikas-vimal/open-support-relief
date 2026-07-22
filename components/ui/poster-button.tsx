import type { ButtonHTMLAttributes, ReactNode } from "react";

export type PosterButtonVariant = "primary" | "secondary" | "danger";
export type PosterButtonSize = "md" | "lg";

interface PosterButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PosterButtonVariant;
  size?: PosterButtonSize;
  children: ReactNode;
}

/*
 * `primary` is a light-green fill with INK text (12.1:1). White on this green
 * is 1.74:1 — never pair them. Ink stays fixed rather than following --fg,
 * because the green fill is the same in both themes.
 */
const VARIANT_CLASSES: Readonly<Record<PosterButtonVariant, string>> = {
  primary: "bg-primary text-brand-ink hover:bg-primary-hover",
  secondary: "bg-surface text-fg hover:bg-surface-2",
  danger: "bg-urgent text-white hover:bg-urgent/90",
};

const SIZE_CLASSES: Readonly<Record<PosterButtonSize, string>> = {
  // min-h-11 == 44px, the minimum comfortable touch target.
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-14 px-5 py-3.5 text-base",
};

export function PosterButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...buttonProps
}: PosterButtonProps) {
  return (
    <button
      className={[
        /* Sentence case, no tracking. ALL-CAPS at .18em cost roughly a third of
           the button's width, which is what forced labels onto two lines in the
           card's two-column row. Urgency stamps keep their caps — there the
           caps IS the rubber-stamp form. */
        "poster-press inline-flex w-full items-center justify-center gap-2 font-semibold whitespace-nowrap",
        "rounded-card border-2 border-border-strong shadow-poster-sm",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
