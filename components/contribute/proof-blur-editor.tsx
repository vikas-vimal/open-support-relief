"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useI18n } from "@/lib/i18n/use-i18n";

interface ProofBlurEditorProps {
  file: File;
  onConfirm: (redacted: File) => void;
  onCancel: () => void;
}

/** Longest edge the editor works at — caps memory and keeps painting smooth. */
const MAX_EDGE = 1400;
/** Redaction strength. Heavy enough that screenshot-scale text is unrecoverable. */
const BLUR_RADIUS_PX = 16;

/**
 * Lets a contributor blur their own PII (name, phone, address) on the order
 * screenshot BEFORE it is uploaded — the redaction happens on the device, so
 * the unblurred pixels never leave it.
 *
 * A strong-blur offscreen copy is prepared once; dragging "paints" from it onto
 * the visible canvas, so each stroke reveals blurred pixels exactly where the
 * finger goes. The exported JPEG contains only the redacted result.
 *
 * Its own <dialog showModal> so it stacks above the contribute sheet in the top
 * layer. Pointer-driven (the task is inherently visual); Cancel/Done are real
 * buttons and keyboard-reachable.
 */
export function ProofBlurEditor({
  file,
  onConfirm,
  onCancel,
}: ProofBlurEditorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blurredRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const [ready, setReady] = useState(false);
  const [touched, setTouched] = useState(false);
  const { t } = useI18n();

  // Load the image, size the canvas, and prepare the blurred source.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
      const width = Math.round(image.width * scale);
      const height = Math.round(image.height * scale);

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(image, 0, 0, width, height);

      const blurred = document.createElement("canvas");
      blurred.width = width;
      blurred.height = height;
      const bctx = blurred.getContext("2d");
      if (bctx) {
        bctx.filter = `blur(${BLUR_RADIUS_PX}px)`;
        bctx.drawImage(image, 0, 0, width, height);
        bctx.filter = "none";
      }
      blurredRef.current = blurred;
      URL.revokeObjectURL(objectUrl);
      setReady(true);
    };
    image.src = objectUrl;

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // Map a pointer event to canvas pixel coordinates (canvas is CSS-scaled).
  const toCanvasPoint = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
        radius: canvas.width * 0.06, // brush scales with the image
      };
    },
    [],
  );

  const paintBlur = useCallback((x: number, y: number, radius: number) => {
    const canvas = canvasRef.current;
    const blurred = blurredRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !blurred || !ctx) return;

    // Reveal blurred pixels inside the brush footprint.
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(blurred, 0, 0);
    ctx.restore();
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const point = toCanvasPoint(event);
      if (!point) return;
      drawing.current = true;
      lastPoint.current = point;
      setTouched(true);
      paintBlur(point.x, point.y, point.radius);
    },
    [toCanvasPoint, paintBlur],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawing.current) return;
      const point = toCanvasPoint(event);
      if (!point) return;

      // Interpolate between samples so a fast drag leaves no gaps.
      const prev = lastPoint.current ?? point;
      const dist = Math.hypot(point.x - prev.x, point.y - prev.y);
      const steps = Math.max(1, Math.floor(dist / (point.radius / 2)));
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        paintBlur(
          prev.x + (point.x - prev.x) * t,
          prev.y + (point.y - prev.y) * t,
          point.radius,
        );
      }
      lastPoint.current = point;
    },
    [toCanvasPoint, paintBlur],
  );

  const stopDrawing = useCallback(() => {
    drawing.current = false;
    lastPoint.current = null;
  }, []);

  const confirm = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onConfirm(
          new File([blob], "proof.jpg", { type: "image/jpeg" }),
        );
      },
      "image/jpeg",
      0.9,
    );
  }, [onConfirm]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      aria-label={t("blur.aria")}
      className="m-0 h-dvh max-h-none w-full max-w-none border-0 bg-canvas p-0 text-fg backdrop:bg-fg/70"
    >
      <div className="flex h-dvh flex-col">
        <header className="border-b-2 border-border-structure bg-header-bg px-4 py-3">
          <h2 className="font-display text-base leading-tight text-fg uppercase">
            {t("blur.title")}
          </h2>
          <p className="mt-0.5 text-xs text-fg-muted">{t("blur.body")}</p>
        </header>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-surface-2 p-3">
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            className="max-h-full max-w-full touch-none border-2 border-border-strong"
            style={{ visibility: ready ? "visible" : "hidden" }}
          />
        </div>

        <footer className="flex gap-2 border-t-2 border-border-structure bg-surface px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border-2 border-border-strong bg-surface px-4 py-3 text-sm font-semibold text-fg"
          >
            {t("blur.cancel")}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!ready}
            className="flex-1 border-2 border-border-strong bg-primary px-4 py-3 text-sm font-semibold text-brand-ink disabled:opacity-50"
          >
            {touched ? t("blur.useBlurred") : t("blur.looksClean")}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
