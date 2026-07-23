import { randomUUID } from "node:crypto";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { ProofMime } from "@/lib/domain/airdrop.constants";

/**
 * Supabase Storage over the S3 protocol, for order-proof screenshots.
 *
 * The bucket is PRIVATE (verified: an unsigned public GET returns 4xx). Objects
 * are only ever reachable through a short-lived signed URL, and only moderators
 * request those — a proof screenshot may contain the contributor's own name,
 * phone and home address, so it must never be publicly addressable.
 *
 * The bucket also enforces an image-only MIME allowlist server-side (jpeg/png),
 * so a non-image upload is rejected even if it slips past our own checks.
 */

const UPLOAD_URL_TTL_SECONDS = 120;
const READ_URL_TTL_SECONDS = 60;

const globalForS3 = globalThis as unknown as { s3: S3Client | undefined };

function s3Client(): S3Client {
  if (globalForS3.s3) return globalForS3.s3;

  const endpoint = process.env.SUPABASE_S3_ENDPOINT;
  const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Supabase S3 storage is not configured — set SUPABASE_S3_* in .env",
    );
  }

  const client = new S3Client({
    region: process.env.SUPABASE_S3_REGION ?? "ap-south-1",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true, // Supabase uses path-style bucket addressing
  });
  if (process.env.NODE_ENV !== "production") globalForS3.s3 = client;
  return client;
}

function bucket(): string {
  const name = process.env.SUPABASE_STORAGE_BUCKET;
  if (!name) throw new Error("SUPABASE_STORAGE_BUCKET is not set");
  return name;
}

export interface PresignedUpload {
  uploadUrl: string;
  /** Opaque storage key we control — never derived from client input. */
  storagePath: string;
}

/**
 * Presigns a one-shot PUT for a proof image.
 *
 * The key is server-generated and namespaced by user, so a client can neither
 * choose a path (traversal / overwrite) nor upload on another user's behalf.
 */
export async function presignProofUpload(
  userId: string,
  contentType: ProofMime,
): Promise<PresignedUpload> {
  const extension = contentType === "image/png" ? "png" : "jpg";
  const storagePath = `proofs/${userId}/${randomUUID()}.${extension}`;

  const uploadUrl = await getSignedUrl(
    s3Client(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: storagePath,
      ContentType: contentType,
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  );

  return { uploadUrl, storagePath };
}

/** Short-lived signed GET for a stored proof — moderator review only. */
export async function signProofReadUrl(storagePath: string): Promise<string> {
  return getSignedUrl(
    s3Client(),
    new GetObjectCommand({ Bucket: bucket(), Key: storagePath }),
    { expiresIn: READ_URL_TTL_SECONDS },
  );
}
