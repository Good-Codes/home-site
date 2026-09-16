import type { PublicEstimateResult } from "@/lib/project-blueprint/types";

export type AdminEstimateListItem = {
  id: string;
  status: string;
  clientName: string | null;
  organisation: string | null;
  rangeDisplay: string;
  confidence: string;
  nextStep: string;
  createdAt: string;
  usingPlaceholderConfiguration: boolean;
};

export type AdminEstimateDetail = {
  id: string;
  status: string;
  createdAt: string;
  client: {
    name: string | null;
    email: string | null;
    organisation: string | null;
    phone: string | null;
    jobTitle: string | null;
    preferredContact: string | null;
    preferredNextStep: string | null;
    city: string | null;
    province: string | null;
    organisationType: string | null;
    industry: string | null;
    teamSize: string | null;
    referralSource: string | null;
  };
  answersSummary: {
    headline: string;
    sections: Array<{ id: string; title: string; body: string }>;
    unknowns: string[];
  };
  concept?: {
    headline?: string;
    summary?: string;
    whoItsFor?: string;
    coreCapabilities?: string[];
    assumptions?: string[];
  } | null;
  publicResult: PublicEstimateResult;
  riskFlags: Array<{ id: string; title: string; explanation: string }>;
  usingPlaceholderConfiguration: boolean;
  /** Admin-only high-level flags — never includes rates. */
  privateNotes: {
    discoveryRecommended: boolean;
    checksum: string;
    pricingVersion: string;
    promptVersion?: string;
    model?: string | null;
  };
};
