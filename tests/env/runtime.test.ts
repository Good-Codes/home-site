import { afterEach, describe, expect, it } from "vitest";

import { runtimeEnv } from "@/lib/env/runtime";

describe("runtimeEnv", () => {
  const key = "HOME_SITE_RUNTIME_ENV_TEST";

  afterEach(() => {
    delete process.env[key];
  });

  it("returns trimmed values and ignores blanks", () => {
    process.env[key] = "  secret  ";
    expect(runtimeEnv(key)).toBe("secret");
    process.env[key] = "   ";
    expect(runtimeEnv(key)).toBeUndefined();
    delete process.env[key];
    expect(runtimeEnv(key)).toBeUndefined();
  });
});
