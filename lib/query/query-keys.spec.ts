import { describe, expect, it } from "vitest";

import { isPersistableQueryKey, queryKeys } from "./query-keys";

describe("isPersistableQueryKey", () => {
  it("persists the public board", () => {
    expect(isPersistableQueryKey(queryKeys.board())).toBe(true);
  });

  it("NEVER persists a drop-point reveal", () => {
    // Writing this to disk would leave a volunteer's address and phone on the
    // device after sign-out and after the isFrozen kill switch is thrown.
    expect(isPersistableQueryKey(queryKeys.dropPointReveal("dp_1"))).toBe(false);
  });

  it("never persists a user's own contributions", () => {
    expect(isPersistableQueryKey(queryKeys.contributions("user_1"))).toBe(false);
  });

  it("rejects an unknown scope by default, rather than allowing it", () => {
    expect(isPersistableQueryKey(["something-new", "x"])).toBe(false);
    expect(isPersistableQueryKey([])).toBe(false);
    expect(isPersistableQueryKey([42])).toBe(false);
  });
});
