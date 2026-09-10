/**
 * Demo estimate payloads for local admin UI when the database is unset.
 * Public-safe shapes only — no rates, margins, or private traces.
 */

import type { PublicEstimateResult } from "@/lib/project-blueprint/types";

export type AdminEstimateListItem = {
  id: string;
  status: string;
  clientName: string | null;
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
    company: string | null;
    phone: string | null;
    preferredNextStep: string | null;
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

const demoPublicResult = (estimateId: string): PublicEstimateResult => ({
  estimateId,
  pricingVersion: "ai-estimate-v1",
  currency: "ZAR",
  generatedAt: "2026-07-18T10:30:00.000Z",
  productSummary: "Customer portal with payments and admin workspace",
  recommendedScenario: {
    id: "recommended",
    name: "Recommended",
    summary: "Full selected scope with standard delivery foundations.",
    includedCapabilityIds: ["frontend", "backend", "integrations", "qa", "security", "pm"],
    range: { low: 420_000, likely: 580_000, high: 760_000 },
    timeline: { minimumWeeks: 14, likelyWeeks: 18, maximumWeeks: 24 },
  },
  alternativeScenarios: [
    {
      id: "lean",
      name: "Lean",
      summary: "Must-have capabilities and mandatory safety foundations.",
      includedCapabilityIds: ["frontend", "backend", "qa", "security", "pm"],
      range: { low: 310_000, likely: 420_000, high: 540_000 },
      timeline: { minimumWeeks: 10, likelyWeeks: 14, maximumWeeks: 18 },
    },
    {
      id: "scale",
      name: "Scale-ready",
      summary: "Recommended scope plus stronger ops and NFR packages.",
      includedCapabilityIds: [
        "frontend",
        "backend",
        "integrations",
        "cloud",
        "qa",
        "security",
        "pm",
        "launch",
      ],
      range: { low: 620_000, likely: 820_000, high: 1_050_000 },
      timeline: { minimumWeeks: 18, likelyWeeks: 24, maximumWeeks: 32 },
    },
  ],
  phaseBreakdown: [
    {
      id: "discovery",
      name: "Discovery & architecture",
      description: "Clarify journeys, integrations, and delivery plan.",
      allocation: { share: 0.12 },
    },
    {
      id: "build",
      name: "Build",
      description: "Core product surfaces and integrations.",
      allocation: { share: 0.62 },
    },
    {
      id: "harden",
      name: "Harden & launch",
      description: "QA, security, handover, and stabilisation.",
      allocation: { share: 0.26 },
    },
  ],
  costDrivers: [
    {
      id: "driver-payments",
      title: "Payment workflows",
      explanation: "One-time payments and reconciliation increase backend and security effort.",
    },
    {
      id: "driver-integrations",
      title: "External systems",
      explanation: "Undocumented APIs widen the range until interface details are confirmed.",
    },
  ],
  confidence: {
    level: "moderate",
    explanation:
      "Enough scope is defined for planning, but integration documentation is still incomplete.",
    unknowns: ["Integration documentation quality", "Exact payment provider certification needs"],
    improvements: [
      "Confirm API documentation and sandbox access",
      "Clarify refund and reconciliation rules",
    ],
  },
  assumptions: [
    {
      id: "a1",
      text: "Good Code designs and builds the primary web application and admin workspace.",
      source: "default",
    },
    {
      id: "a2",
      text: "Content and business rules are provided by the client during discovery.",
      source: "engine",
    },
  ],
  exclusions: [
    "Ongoing marketing campaigns",
    "Hardware procurement",
    "Third-party licence fees paid directly to vendors",
  ],
  discoveryRecommended: false,
  nextStepRecommendation:
    "Book a short specialist review to turn this planning estimate into a reviewed quotation.",
  usingPlaceholderConfiguration: true,
});

const DEMO_CLIENT_COMPANY: Record<string, string | null> = {
  "demo-est-001": "Riverbank Logistics",
  "demo-est-002": null,
  "demo-est-003": "Plainfield Clinics",
};

export const DEMO_ESTIMATE_LIST: AdminEstimateListItem[] = [
  {
    id: "demo-est-001",
    status: "lead_captured",
    clientName: "Thandi Molefe",
    rangeDisplay: "R420k–R760k",
    confidence: "moderate",
    nextStep: "Specialist review / quotation",
    createdAt: "2026-07-18T10:30:00.000Z",
    usingPlaceholderConfiguration: true,
  },
  {
    id: "demo-est-002",
    status: "calculated",
    clientName: "Alex Naidoo",
    rangeDisplay: "R180k–R310k",
    confidence: "early",
    nextStep: "Discovery workshop recommended",
    createdAt: "2026-07-19T14:05:00.000Z",
    usingPlaceholderConfiguration: true,
  },
  {
    id: "demo-est-003",
    status: "in_review",
    clientName: "Johan Botha",
    rangeDisplay: "R620k–R1.05m",
    confidence: "moderate",
    nextStep: "Draft quotation in progress",
    createdAt: "2026-07-20T08:15:00.000Z",
    usingPlaceholderConfiguration: true,
  },
];

export function getDemoEstimateDetail(id: string): AdminEstimateDetail | null {
  const listItem = DEMO_ESTIMATE_LIST.find((item) => item.id === id);
  if (!listItem) return null;

  const publicResult = demoPublicResult(id);
  if (id === "demo-est-002") {
    publicResult.productSummary = "Internal operations tool — early scope";
    publicResult.recommendedScenario.range = {
      low: 180_000,
      likely: 240_000,
      high: 310_000,
    };
    publicResult.confidence.level = "early";
    publicResult.discoveryRecommended = true;
    publicResult.discoverySummary =
      "Several unknowns and a legacy replacement signal suggest a discovery engagement first.";
    publicResult.nextStepRecommendation =
      "Start with a fixed discovery engagement before committing to a full build range.";
  }

  return {
    id,
    status: listItem.status,
    createdAt: listItem.createdAt,
    client: {
      name: listItem.clientName,
      email: listItem.clientName
        ? `${listItem.clientName.toLowerCase().replace(/\s+/g, ".")}@example.co.za`
        : null,
      company: DEMO_CLIENT_COMPANY[id] ?? null,
      phone: listItem.clientName ? "+27 82 000 0000" : null,
      preferredNextStep: listItem.clientName ? "call" : null,
    },
    answersSummary: {
      headline: publicResult.productSummary,
      sections: [
        {
          id: "context",
          title: "Context",
          body: "New product idea aiming to improve customer service and reduce manual work.",
        },
        {
          id: "surfaces",
          title: "Surfaces",
          body: "Public web, customer portal, and administration workspace.",
        },
        {
          id: "capabilities",
          title: "Capabilities",
          body: "Role-based access, payments, notifications, and reporting.",
        },
        {
          id: "integrations",
          title: "Integrations",
          body: "Accounting system and payment provider; documentation incomplete.",
        },
      ],
      unknowns: publicResult.confidence.unknowns,
    },
    publicResult,
    riskFlags: [
      {
        id: "risk-integrations",
        title: "Undocumented integrations",
        explanation:
          "Missing API documentation widens the investment band until interfaces are confirmed.",
      },
      ...(publicResult.discoveryRecommended
        ? [
            {
              id: "risk-discovery",
              title: "Discovery-first recommended",
              explanation:
                "Unknown weight and delivery risk suggest fixing scope in discovery before a full build quote.",
            },
          ]
        : []),
    ],
    usingPlaceholderConfiguration: true,
    concept: {
      headline: publicResult.productSummary,
      summary: publicResult.productSummary,
      whoItsFor: "South African operations teams",
      coreCapabilities: ["Status tracking", "Admin workspace"],
      assumptions: ["First release is web-only."],
    },
    privateNotes: {
      discoveryRecommended: publicResult.discoveryRecommended,
      checksum: `demo-checksum-${id}`,
      pricingVersion: publicResult.pricingVersion,
      promptVersion: "ai-estimate-v1",
      model: "gpt-4o",
    },
  };
}
