import { describe, expect, it } from "vitest";

import {
  RECEIVER_CODE_ALPHABET,
  RECEIVER_CODE_LENGTH,
  RECEIVER_CODE_PREFIX,
} from "./airdrop.constants";
import { generateReceiverCode, isValidReceiverCode } from "./receiver-code.util";

describe("generateReceiverCode", () => {
  it("has the prefix and the right length of alphabet characters", () => {
    const code = generateReceiverCode();
    expect(code.startsWith(RECEIVER_CODE_PREFIX)).toBe(true);
    const body = code.slice(RECEIVER_CODE_PREFIX.length);
    expect(body).toHaveLength(RECEIVER_CODE_LENGTH);
    for (const char of body) {
      expect(RECEIVER_CODE_ALPHABET).toContain(char);
    }
  });

  it("never uses visually ambiguous characters", () => {
    // Guards the alphabet choice: 0/O, 1/I/L are the ones a moderator misreads.
    for (const banned of ["0", "O", "1", "I", "L"]) {
      expect(RECEIVER_CODE_ALPHABET).not.toContain(banned);
    }
  });

  it("produces distinct codes across a batch (uniqueness in practice)", () => {
    const codes = new Set(
      Array.from({ length: 1000 }, () => generateReceiverCode()),
    );
    expect(codes.size).toBe(1000);
  });

  it("is accepted by its own validator", () => {
    expect(isValidReceiverCode(generateReceiverCode())).toBe(true);
  });
});

describe("isValidReceiverCode", () => {
  it.each([
    ["", false],
    ["CJP-", false],
    ["7F3KABCD", false], // no prefix
    ["CJP-7F3KABC", false], // too short
    ["CJP-7F3KABCDE", false], // too long
    ["CJP-7F3KABC0", false], // banned char 0
    ["cjp-ABCDEFGH", false], // wrong-case prefix
  ])("rejects %j", (input, expected) => {
    expect(isValidReceiverCode(input)).toBe(expected);
  });
});
