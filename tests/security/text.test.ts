import { describe, expect, it } from "vitest";

import {
  escapeHtml,
  sanitizePersonName,
  sanitizePlainText,
  stripControlChars,
} from "@/lib/security/text";

describe("stripControlChars", () => {
  it("drops null bytes and other C0 controls", () => {
    expect(stripControlChars("Ada\u0000 Lovelace")).toBe("Ada Lovelace");
  });

  it("can keep newlines", () => {
    expect(
      stripControlChars("line 1\nline 2\u0007", { keepNewlines: true }),
    ).toBe("line 1\nline 2");
  });
});

describe("sanitizePersonName", () => {
  it("keeps apostrophes, hyphens, and accented letters", () => {
    expect(sanitizePersonName("O'Brien")).toBe("O'Brien");
    expect(sanitizePersonName("O’Brien")).toBe("O’Brien");
    expect(sanitizePersonName("José")).toBe("José");
    expect(sanitizePersonName("Anne-Marie")).toBe("Anne-Marie");
    expect(sanitizePersonName("St. John")).toBe("St. John");
  });

  it("strips markup and leftover angle brackets", () => {
    expect(sanitizePersonName("<script>alert(1)</script>Ada")).toBe("Ada");
    expect(sanitizePersonName("Ada <b>Lovelace</b>")).toBe("Ada Lovelace");
  });

  it("collapses whitespace and trims", () => {
    expect(sanitizePersonName("  Ada   Lovelace  ")).toBe("Ada Lovelace");
  });
});

describe("sanitizePlainText", () => {
  it("trims, collapses spaces, and caps length", () => {
    expect(
      sanitizePlainText("  hello   world  ", { maxLength: 20 }),
    ).toBe("hello world");
    expect(
      sanitizePlainText("abcdefghij", { maxLength: 4, collapseWhitespace: false }),
    ).toBe("abcd");
  });

  it("keeps newlines in long-form fields", () => {
    expect(
      sanitizePlainText("line 1\n\nline 2", {
        maxLength: 40,
        keepNewlines: true,
        collapseWhitespace: true,
      }),
    ).toBe("line 1\n\nline 2");
  });
});

describe("escapeHtml", () => {
  it("encodes markup and quotes for HTML sinks", () => {
    expect(escapeHtml(`<script>alert("x")</script> O'Brien`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; O&#039;Brien",
    );
  });
});
