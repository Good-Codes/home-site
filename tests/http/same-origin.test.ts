import { afterEach, describe, expect, it } from "vitest";

import { isAllowedRequestOrigin } from "@/lib/http/same-origin";

describe("isAllowedRequestOrigin", () => {
  const previous = process.env.AUTH_URL;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.AUTH_URL;
    } else {
      process.env.AUTH_URL = previous;
    }
  });

  it("accepts the request origin", () => {
    const request = new Request("http://localhost/api/contact", {
      headers: { Origin: "http://localhost" },
    });
    expect(isAllowedRequestOrigin(request)).toBe(true);
  });

  it("rejects a foreign origin", () => {
    const request = new Request("http://localhost/api/contact", {
      headers: { Origin: "https://evil.example" },
    });
    expect(isAllowedRequestOrigin(request)).toBe(false);
  });

  it("rejects a missing origin and referer", () => {
    const request = new Request("http://localhost/api/contact");
    expect(isAllowedRequestOrigin(request)).toBe(false);
  });

  it("accepts AUTH_URL as an allowed origin", () => {
    process.env.AUTH_URL = "https://www.goodcode.co.za";
    const request = new Request("http://127.0.0.1:3000/api/contact", {
      headers: { Origin: "https://www.goodcode.co.za" },
    });
    expect(isAllowedRequestOrigin(request)).toBe(true);
  });
});
