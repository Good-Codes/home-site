import { describe, expect, it } from "vitest";

import {
  adminClientFromUserAndLead,
  emptyFieldWriteBack,
  isCustomerProfileIncomplete,
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

  it("keeps apostrophes in profile names and strips markup", () => {
    const parsed = profileUpdateSchema.safeParse({
      name: "O'Brien <b>Ada</b>",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.name).toBe("O'Brien Ada");
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

  it("uses a retained client snapshot when the user is gone", () => {
    const client = adminClientFromUserAndLead(
      null,
      {
        name: "Lead Name",
        email: "lead@example.com",
        company: "Lead Co",
        phone: "0111",
        preferredNextStep: "call",
      },
      {
        name: "Sipho",
        email: "sipho@example.com",
        organisation: "Acme",
        phone: "0821",
        jobTitle: "Ops",
        preferredContact: "email",
        city: "Polokwane",
        province: "LP",
        organisationType: "small_business",
        industry: "logistics",
        teamSize: "two_to_ten",
        referralSource: "google",
      },
    );
    expect(client.name).toBe("Sipho");
    expect(client.email).toBe("sipho@example.com");
    expect(client.organisation).toBe("Acme");
    expect(client.city).toBe("Polokwane");
    expect(client.preferredNextStep).toBe("call");
  });

  it("treats a signed-up profile as incomplete until contact details are filled", () => {
    expect(isCustomerProfileIncomplete(blankUser)).toBe(true);
    expect(
      isCustomerProfileIncomplete({
        ...blankUser,
        name: "Ada Lovelace",
      }),
    ).toBe(true);
    expect(
      isCustomerProfileIncomplete({
        ...blankUser,
        name: "Ada Lovelace",
        phone: "082 000 0000",
        organisation: "Acme",
      }),
    ).toBe(false);
  });
});
