import { afterEach, describe, expect, it } from "vitest";

import {
  contactFromAddress,
  contactToAddress,
  DEFAULT_CONTACT_INBOX,
} from "@/lib/email/resend";

describe("contact email addresses", () => {
  const keys = ["CONTACT_EMAIL_FROM", "CONTACT_EMAIL_TO", "RESEND_FROM_EMAIL"] as const;
  const previous = new Map<string, string | undefined>();

  afterEach(() => {
    for (const key of keys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    previous.clear();
  });

  function stash(key: (typeof keys)[number]) {
    if (!previous.has(key)) previous.set(key, process.env[key]);
  }

  it("defaults the inbox to admin@goodcode.co.za", () => {
    stash("CONTACT_EMAIL_TO");
    delete process.env.CONTACT_EMAIL_TO;
    expect(contactToAddress()).toBe(DEFAULT_CONTACT_INBOX);
    expect(DEFAULT_CONTACT_INBOX).toBe("admin@goodcode.co.za");
  });

  it("falls back to RESEND_FROM_EMAIL when CONTACT_EMAIL_FROM is unset", () => {
    stash("CONTACT_EMAIL_FROM");
    stash("RESEND_FROM_EMAIL");
    delete process.env.CONTACT_EMAIL_FROM;
    process.env.RESEND_FROM_EMAIL = "notifications@goodcode.co.za";
    expect(contactFromAddress()).toBe("notifications@goodcode.co.za");
  });
});
