"use client";

import { useRef, useState } from "react";

import { ProofBlurEditor } from "@/components/contribute/proof-blur-editor";
import { uploadProof, UploadError } from "@/lib/api/upload.client";
import { useI18n } from "@/lib/i18n/use-i18n";

interface ProofUploadProps {
  onUploaded: (storagePath: string | null) => void;
}

type UploadState = "idle" | "working" | "done" | "error";

/**
 * Optional proof-screenshot upload for a contribution.
 *
 * Every selected image passes through the blur editor FIRST, so the contributor
 * redacts their own name/phone/address on-device before anything is uploaded.
 * Location metadata is stripped automatically during compression, so a photo's
 * GPS never reaches storage either.
 */
export function ProofUpload({ onUploaded }: ProofUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  async function upload(file: File): Promise<void> {
    setState("working");
    setError(null);
    try {
      const storagePath = await uploadProof(file);
      onUploaded(storagePath);
      setState("done");
    } catch (uploadError) {
      onUploaded(null);
      setError(
        uploadError instanceof UploadError
          ? uploadError.message
          : t("proof.uploadFailed"),
      );
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.6875rem] leading-relaxed text-fg-muted">
        {t("proof.hint")}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) setEditingFile(file);
          // Allow re-selecting the same file later.
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={state === "working"}
        className="rounded-card border-2 border-dashed border-border-strong bg-surface px-3 py-3 text-sm font-semibold text-fg disabled:opacity-60"
      >
        {state === "working"
          ? t("proof.uploading")
          : state === "done"
            ? t("proof.added")
            : t("proof.addProof")}
      </button>

      {state === "error" && error && (
        <p role="alert" className="text-xs font-semibold text-danger">
          {error}
        </p>
      )}

      {editingFile && (
        <ProofBlurEditor
          file={editingFile}
          onCancel={() => setEditingFile(null)}
          onConfirm={(redacted) => {
            setEditingFile(null);
            void upload(redacted);
          }}
        />
      )}
    </div>
  );
}
