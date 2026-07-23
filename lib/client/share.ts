import type { ShareContent } from "@/lib/domain/share.util";

/**
 * Share via the native Web Share sheet, falling back to WhatsApp.
 *
 * On mobile (the target) `navigator.share` opens the OS sheet — WhatsApp,
 * Instagram, anything installed. Where that is unavailable (most desktops) we
 * open WhatsApp's web composer, since WhatsApp is how supply requests actually
 * spread for this audience. A user cancelling the native sheet is NOT a failure,
 * so it must not fall through to opening WhatsApp.
 */
export async function shareContent(content: ShareContent): Promise<void> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text: content.text, url: content.url });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      // Any other error: fall through to the WhatsApp composer.
    }
  }

  const message = `${content.text}\n${content.url}`;
  const target = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(target, "_blank", "noopener,noreferrer");
}

/**
 * Share an image (the story-sized airdrop card) when the platform supports
 * sharing files; otherwise trigger a download so the user can post it manually.
 */
export async function shareImage(
  file: File,
  fallbackText: ShareContent,
): Promise<void> {
  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  if (canShareFiles && typeof navigator.share === "function") {
    try {
      await navigator.share({ files: [file], text: fallbackText.text });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  const href = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}
