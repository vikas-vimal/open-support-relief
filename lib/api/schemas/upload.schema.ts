import { z } from "zod";

import { ALLOWED_PROOF_MIME } from "@/lib/domain/airdrop.constants";

export const uploadSignRequestSchema = z.object({
  contentType: z.enum(ALLOWED_PROOF_MIME),
});

export const uploadSignResponseSchema = z.object({
  uploadUrl: z.string().url(),
  storagePath: z.string().min(1),
});

export type UploadSignResponse = z.infer<typeof uploadSignResponseSchema>;
