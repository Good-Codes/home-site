import { describe, expect, it } from "vitest";

import { comparePassword, hashPassword } from "@/lib/auth/password";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/constants";

describe("password hashing", () => {
  it("hashes and verifies a password without storing the plaintext", async () => {
    const password = "a-sufficiently-long-pass";
    expect(password.length).toBeGreaterThanOrEqual(PASSWORD_MIN_LENGTH);
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true);
    await expect(comparePassword(password, hash)).resolves.toBe(true);
    await expect(comparePassword("wrong-password-12", hash)).resolves.toBe(false);
  });
});
