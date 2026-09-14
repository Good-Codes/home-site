import { describe, expect, it } from "vitest";

import {
  adminClientFromUserAndLead,
  emptyFieldWriteBack,
  organisationDisplay,
  profileUpdateSchema,
  quoteClientSnapshot,
} from "@/lib/account/profile";

const blankUser = {
  email: "ada@example.com",
  name: null as string | null,
  phone: null as string | null,
  preferredContact: null,
  organisation: null as string | null,
  jobTitle: null,
  city: null,
  province: null,
  organisationType: null,
  industry: null,
  teamSize: null,
  referralSource: null,
};

describe("customer profile helpers", () => {
  it("strips email and role from an update payload", () => {
    const parsed = profileUpdateSchema.safeParse({
      name: "Ada Lovelace",
      email: "hacked@example.com",
      role: "ADMIN",
      password: "nope-not-allowed",
      organisation: " Acme ",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toMatchObject({
      name: "Ada Lovelace",
      organisation: "Acme",
    });
    expect(parsed.data).not.toHaveProperty("email");
    expect(parsed.data).not.toHaveProperty("role");
  });

  it("treats empty strings as null", () => {
    const parsed = profileUpdateSchema.safeParse({
      name: "  ",
      phone: "",
      preferredContact: "",
      province: "",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.name).toBeNull();
    expect(parsed.data.phone).toBeNull();
    expect(parsed.data.preferredContact).toBeNull();
    expect(parsed.data.province).toBeNull();
  });

  it("writes back only empty profile fields", () => {
    expect(
      emptyFieldWriteBack(
        { name: null, phone: null, organisation: null },
        { name: "Sipho", phone: "082 000 0000", organisation: "Acme" },
      ),
    ).toEqual({
      name: "Sipho",
      phone: "082 000 0000",
      organisation: "Acme",
    });

    expect(
      emptyFieldWriteBack(
        {
          name: "Sipho",
          phone: "082 000 0000",
          organisation: "Acme Logistics",
        },
        {
          name: "Someone Else",
          phone: "011 000 0000",
          organisation: "Acme (test)",
        },
      ),
    ).toBeNull();
  });

  it("does not copy a blank incoming value onto an empty profile field", () => {
    expect(
      emptyFieldWriteBack(
        { name: null, phone: null, organisation: null },
        { name: "  ", phone: undefined, organisation: "" },
      ),
    ).toBeNull();
  });

  it("prefers profile organisation over the lead company", () => {
    expect(organisationDisplay("Acme Logistics", "Acme (test)")).toBe(
      "Acme Logistics",
    );
    expect(organisationDisplay(null, "Acme (test)")).toBe("Acme (test)");
    expect(organisationDisplay("  ", null)).toBeNull();
  });

  it("builds admin client details from the profile with lead fallback", () => {
    const client = adminClientFromUserAndLead(
      { ...blankUser, name: "Sipho", organisation: "Acme", phone: "0821" },
      {
        name: "Lead Name",
        email: "lead@example.com",
        company: "Lead Co",
        phone: "0111",
        preferredNextStep: "workshop",
      },
    );
    expect(client.name).toBe("Sipho");
    expect(client.organisation).toBe("Acme");
    expect(client.phone).toBe("0821");
    expect(client.preferredNextStep).toBe("workshop");
    expect(quoteClientSnapshot(client)).toEqual({
      name: "Sipho",
      email: "ada@example.com",
      organisation: "Acme",
      phone: "0821",
      jobTitle: null,
    });
  });
});
