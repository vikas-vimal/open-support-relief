import imageCompression from "browser-image-compression";

import { uploadSignResponseSchema } from "@/lib/api/schemas/upload.schema";
import { signIn } from "@/lib/auth/auth-client";
import { PROOF_MAX_SIZE_MB } from "@/lib/domain/airdrop.constants";

export class UploadError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

const OUTPUT_MIME = "image/jpeg";

/**
 * Compresses a proof screenshot and uploads it straight to Supabase Storage.
 *
 * Two things happen in the compression step, both deliberate:
 *  1. Size — screenshots are large; we target ~400KB so a 2G upload is bearable.
 *  2. Privacy — re-encoding through a canvas STRIPS EXIF, including any GPS
 *     coordinates a phone camera embedded. The file that leaves the device
 *     carries no location metadata.
 *
 * The bucket rejects WebP, so output is JPEG. The file goes directly to storage
 * via a presigned PUT — it never passes through our server.
 *
 * Returns the storage key to attach to the contribution.
 */
export async function uploadProof(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: PROOF_MAX_SIZE_MB,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: OUTPUT_MIME,
    // Drop all metadata (orientation is baked into pixels by the re-encode).
    preserveExif: false,
  });

  let signResponse = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contentType: OUTPUT_MIME }),
  });

  if (signResponse.status === 401) {
    await signIn.anonymous();
    signResponse = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contentType: OUTPUT_MIME }),
    });
  }

  if (!signResponse.ok) {
    throw new UploadError("Could not start the upload", signResponse.status);
  }

  const parsed = uploadSignResponseSchema.safeParse(await signResponse.json());
  if (!parsed.success) throw new UploadError("Unexpected sign response");

  const put = await fetch(parsed.data.uploadUrl, {
    method: "PUT",
    headers: { "content-type": OUTPUT_MIME },
    body: compressed,
  });
  if (!put.ok) {
    throw new UploadError("Upload failed — check your connection", put.status);
  }

  return parsed.data.storagePath;
}
