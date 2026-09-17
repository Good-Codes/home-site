import { z } from "zod";

import {
  PERSON_NAME_MAX,
  sanitizePersonName,
  sanitizePlainText,
} from "@/lib/security/text";

export const PREFERRED_CONTACT_VALUES = ["email", "call", "whatsapp"] as const;
export const SA_PROVINCE_VALUES = [
  "EC",
  "FS",
  "GP",
  "KZN",
  "LP",
  "MP",
  "NC",
  "NW",
  "WC",
] as const;
export const ORGANISATION_TYPE_VALUES = [
  "startup",
  "small_business",
  "established",
  "agency",
  "npo",
  "other",
] as const;
export const INDUSTRY_VALUES = [
  "retail",
  "healthcare",
  "finance",
  "logistics",
  "education",
  "manufacturing",
  "professional_services",
  "government",
  "other",
] as const;
export const TEAM_SIZE_VALUES = [
  "just_me",
  "two_to_ten",
  "eleven_to_fifty",
  "fifty_one_plus",
] as const;
export const REFERRAL_SOURCE_VALUES = [
  "referral",
  "google",
  "linkedin",
  "existing_client",
  "other",
] as const;

export type PreferredContactValue = (typeof PREFERRED_CONTACT_VALUES)[number];
export type SaProvinceValue = (typeof SA_PROVINCE_VALUES)[number];
export type OrganisationTypeValue = (typeof ORGANISATION_TYPE_VALUES)[number];
export type IndustryValue = (typeof INDUSTRY_VALUES)[number];
export type TeamSizeValue = (typeof TEAM_SIZE_VALUES)[number];
export type ReferralSourceValue = (typeof REFERRAL_SOURCE_VALUES)[number];

export const PREFERRED_CONTACT_LABELS: Record<PreferredContactValue, string> = {
  email: "Email",
  call: "Phone call",
  whatsapp: "WhatsApp",
};

export const SA_PROVINCE_LABELS: Record<SaProvinceValue, string> = {
  EC: "Eastern Cape",
  FS: "Free State",
  GP: "Gauteng",
  KZN: "KwaZulu-Natal",
  LP: "Limpopo",
  MP: "Mpumalanga",
  NC: "Northern Cape",
  NW: "North West",
  WC: "Western Cape",
};

export const ORGANISATION_TYPE_LABELS: Record<OrganisationTypeValue, string> = {
  startup: "Startup",
  small_business: "Small business",
  established: "Established company",
  agency: "Agency",
  npo: "Non-profit",
  other: "Other",
};

export const INDUSTRY_LABELS: Record<IndustryValue, string> = {
  retail: "Retail",
  healthcare: "Healthcare",
  finance: "Finance",
  logistics: "Logistics",
  education: "Education",
  manufacturing: "Manufacturing",
  professional_services: "Professional services",
  government: "Government",
  other: "Other",
};

export const TEAM_SIZE_LABELS: Record<TeamSizeValue, string> = {
  just_me: "Just me",
  two_to_ten: "2–10",
  eleven_to_fifty: "11–50",
  fifty_one_plus: "51+",
};

export const REFERRAL_SOURCE_LABELS: Record<ReferralSourceValue, string> = {
  referral: "Referral",
  google: "Google",
  linkedin: "LinkedIn",
  existing_client: "Existing client",
  other: "Other",
};

const optionalText = (max: number) =>
  z
    .union([z.string().max(max), z.null()])
    .optional()
    .transform((value) => {
      if (value == null) return null;
      const cleaned = sanitizePlainText(value, { maxLength: max });
      return cleaned.length ? cleaned : null;
    });

const optionalName = z
  .union([z.string().max(PERSON_NAME_MAX), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const name = sanitizePersonName(value, PERSON_NAME_MAX);
    return name.length ? name : null;
  });

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.enum(values), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === "" || value == null ? null : value));

export const profileUpdateSchema = z.object({
  name: optionalName,
  phone: optionalText(40),
  preferredContact: optionalEnum(PREFERRED_CONTACT_VALUES),
  organisation: optionalText(160),
  jobTitle: optionalText(120),
  city: optionalText(80),
  province: optionalEnum(SA_PROVINCE_VALUES),
  organisationType: optionalEnum(ORGANISATION_TYPE_VALUES),
  industry: optionalEnum(INDUSTRY_VALUES),
  teamSize: optionalEnum(TEAM_SIZE_VALUES),
  referralSource: optionalEnum(REFERRAL_SOURCE_VALUES),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export type CustomerProfile = {
  email: string;
  name: string | null;
  phone: string | null;
  preferredContact: PreferredContactValue | null;
  organisation: string | null;
  jobTitle: string | null;
  city: string | null;
  province: SaProvinceValue | null;
  organisationType: OrganisationTypeValue | null;
  industry: IndustryValue | null;
  teamSize: TeamSizeValue | null;
  referralSource: ReferralSourceValue | null;
};

export const PROFILE_SELECT = {
  email: true,
  name: true,
  phone: true,
  preferredContact: true,
  organisation: true,
  jobTitle: true,
  city: true,
  province: true,
  organisationType: true,
  industry: true,
  teamSize: true,
  referralSource: true,
} as const;

export function isBlank(value: string | null | undefined): boolean {
  return !value?.trim();
}

/** Contact fields we prompt for after signup. Enums stay optional. */
export const PROFILE_COMPLETION_FIELDS = [
  "name",
  "phone",
  "organisation",
] as const satisfies ReadonlyArray<keyof CustomerProfile>;

export type ProfileCompletionFields = Pick<
  CustomerProfile,
  (typeof PROFILE_COMPLETION_FIELDS)[number]
>;

export function isCustomerProfileIncomplete(
  profile: ProfileCompletionFields,
): boolean {
  return PROFILE_COMPLETION_FIELDS.some((field) => isBlank(profile[field]));
}

export function organisationDisplay(
  profileOrganisation: string | null | undefined,
  leadCompany: string | null | undefined,
): string | null {
  const fromProfile = profileOrganisation?.trim();
  if (fromProfile) return fromProfile;
  const fromLead = leadCompany?.trim();
  return fromLead || null;
}

export function emptyFieldWriteBack(
  current: {
    name: string | null;
    phone: string | null;
    organisation: string | null;
  },
  incoming: {
    name?: string | null;
    phone?: string | null;
    organisation?: string | null;
  },
): { name?: string; phone?: string; organisation?: string } | null {
  const data: { name?: string; phone?: string; organisation?: string } = {};
  const nextName = incoming.name
    ? sanitizePersonName(incoming.name)
    : "";
  const nextPhone = incoming.phone?.trim();
  const nextOrganisation = incoming.organisation?.trim();
  if (isBlank(current.name) && nextName) data.name = nextName;
  if (isBlank(current.phone) && nextPhone) data.phone = nextPhone;
  if (isBlank(current.organisation) && nextOrganisation) {
    data.organisation = nextOrganisation;
  }
  return Object.keys(data).length > 0 ? data : null;
}

export type ProfileUserRow = {
  email: string;
  name: string | null;
  phone: string | null;
  preferredContact: PreferredContactValue | null;
  organisation: string | null;
  jobTitle: string | null;
  city: string | null;
  province: SaProvinceValue | null;
  organisationType: OrganisationTypeValue | null;
  industry: IndustryValue | null;
  teamSize: TeamSizeValue | null;
  referralSource: ReferralSourceValue | null;
};

export type LeadContactRow = {
  name: string | null;
  email: string | null;
  company: string | null;
  phone: string | null;
  preferredNextStep: string | null;
};

export type EstimateClientSnapshot = {
  name: string | null;
  email: string | null;
  organisation: string | null;
  phone: string | null;
  jobTitle: string | null;
  preferredContact: PreferredContactValue | null;
  city: string | null;
  province: SaProvinceValue | null;
  organisationType: OrganisationTypeValue | null;
  industry: IndustryValue | null;
  teamSize: TeamSizeValue | null;
  referralSource: ReferralSourceValue | null;
};

export type AdminClientView = {
  name: string | null;
  email: string | null;
  organisation: string | null;
  phone: string | null;
  jobTitle: string | null;
  preferredContact: PreferredContactValue | null;
  preferredNextStep: string | null;
  city: string | null;
  province: SaProvinceValue | null;
  organisationType: OrganisationTypeValue | null;
  industry: IndustryValue | null;
  teamSize: TeamSizeValue | null;
  referralSource: ReferralSourceValue | null;
};

function snapshotText(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const raw = record[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function snapshotEnum<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T | null {
  const raw = record[key];
  return typeof raw === "string" && (allowed as readonly string[]).includes(raw)
    ? (raw as T)
    : null;
}

export function parseClientSnapshot(value: unknown): EstimateClientSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    name: snapshotText(record, "name"),
    email: snapshotText(record, "email"),
    organisation: snapshotText(record, "organisation"),
    phone: snapshotText(record, "phone"),
    jobTitle: snapshotText(record, "jobTitle"),
    preferredContact: snapshotEnum(
      record,
      "preferredContact",
      PREFERRED_CONTACT_VALUES,
    ),
    city: snapshotText(record, "city"),
    province: snapshotEnum(record, "province", SA_PROVINCE_VALUES),
    organisationType: snapshotEnum(
      record,
      "organisationType",
      ORGANISATION_TYPE_VALUES,
    ),
    industry: snapshotEnum(record, "industry", INDUSTRY_VALUES),
    teamSize: snapshotEnum(record, "teamSize", TEAM_SIZE_VALUES),
    referralSource: snapshotEnum(record, "referralSource", REFERRAL_SOURCE_VALUES),
  };
}

export function adminClientFromUserAndLead(
  user: ProfileUserRow | null | undefined,
  lead: LeadContactRow | null | undefined,
  snapshot?: EstimateClientSnapshot | null,
): AdminClientView {
  return {
    name:
      user?.name?.trim() ||
      snapshot?.name?.trim() ||
      lead?.name?.trim() ||
      user?.email ||
      snapshot?.email ||
      null,
    email: user?.email || snapshot?.email || lead?.email || null,
    organisation: organisationDisplay(
      user?.organisation ?? snapshot?.organisation,
      lead?.company,
    ),
    phone:
      user?.phone?.trim() ||
      snapshot?.phone?.trim() ||
      lead?.phone?.trim() ||
      null,
    jobTitle: user?.jobTitle?.trim() || snapshot?.jobTitle?.trim() || null,
    preferredContact: user?.preferredContact ?? snapshot?.preferredContact ?? null,
    preferredNextStep: lead?.preferredNextStep ?? null,
    city: user?.city?.trim() || snapshot?.city?.trim() || null,
    province: user?.province ?? snapshot?.province ?? null,
    organisationType:
      user?.organisationType ?? snapshot?.organisationType ?? null,
    industry: user?.industry ?? snapshot?.industry ?? null,
    teamSize: user?.teamSize ?? snapshot?.teamSize ?? null,
    referralSource: user?.referralSource ?? snapshot?.referralSource ?? null,
  };
}

export function snapshotFromUserAndLead(
  user: ProfileUserRow,
  lead: LeadContactRow | null | undefined,
): EstimateClientSnapshot {
  const client = adminClientFromUserAndLead(user, lead);
  return {
    name: client.name,
    email: client.email,
    organisation: client.organisation,
    phone: client.phone,
    jobTitle: client.jobTitle,
    preferredContact: client.preferredContact,
    city: client.city,
    province: client.province,
    organisationType: client.organisationType,
    industry: client.industry,
    teamSize: client.teamSize,
    referralSource: client.referralSource,
  };
}

export function quoteClientSnapshot(client: AdminClientView): {
  name: string | null;
  email: string | null;
  organisation: string | null;
  phone: string | null;
  jobTitle: string | null;
} {
  return {
    name: client.name,
    email: client.email,
    organisation: client.organisation,
    phone: client.phone,
    jobTitle: client.jobTitle,
  };
}

export function toCustomerProfile(user: ProfileUserRow): CustomerProfile {
  return {
    email: user.email,
    name: user.name?.trim() || null,
    phone: user.phone?.trim() || null,
    preferredContact: user.preferredContact,
    organisation: user.organisation?.trim() || null,
    jobTitle: user.jobTitle?.trim() || null,
    city: user.city?.trim() || null,
    province: user.province,
    organisationType: user.organisationType,
    industry: user.industry,
    teamSize: user.teamSize,
    referralSource: user.referralSource,
  };
}

export function formatEnumLabel(
  value: string | null | undefined,
  labels: Record<string, string>,
): string | null {
  if (!value) return null;
  return labels[value] ?? value.replace(/_/g, " ");
}
