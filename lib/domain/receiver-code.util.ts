import {
  RECEIVER_CODE_ALPHABET,
  RECEIVER_CODE_LENGTH,
  RECEIVER_CODE_PREFIX,
} from "./airdrop.constants";

/**
 * The parcel matching code a supporter sets as the delivery recipient's name.
 *
 * Isomorphic (Web Crypto, present in Node and the browser) so it can be unit
 * tested and, if ever needed, generated client-side — but in practice the server
 * issues it at reveal. Not a secret: it only has to be unambiguous to read off a
 * parcel and unique enough that the DB unique constraint effectively never
 * fires. The slight modulo bias across the 29-char alphabet is irrelevant to
 * that goal.
 */
export function generateReceiverCode(): string {
  const bytes = new Uint8Array(RECEIVER_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let body = "";
  for (let i = 0; i < RECEIVER_CODE_LENGTH; i += 1) {
    body += RECEIVER_CODE_ALPHABET[bytes[i] % RECEIVER_CODE_ALPHABET.length];
  }
  return `${RECEIVER_CODE_PREFIX}${body}`;
}

const RECEIVER_CODE_REGEX = new RegExp(
  `^${RECEIVER_CODE_PREFIX}[${RECEIVER_CODE_ALPHABET}]{${RECEIVER_CODE_LENGTH}}$`,
);

/** True for a well-formed code — used to reject a tampered client-supplied one. */
export function isValidReceiverCode(code: string): boolean {
  return RECEIVER_CODE_REGEX.test(code);
}
