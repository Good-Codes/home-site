/**
 * Deterministic keyword classifier for idea intake fallback.
 * Returns taxonomy suggestions. Never invents prices or numeric estimates.
 */

import type {
  ClassifierSuggestion,
  ClassifierSuggestionCategory,
  IdeaClassificationResult,
} from "../types";

type KeywordRule = {
  id: string;
  category: ClassifierSuggestionCategory;
  label: string;
  patterns: RegExp[];
  rationale: string;
  confidence: "high" | "moderate" | "low";
  relatedQuestionIds?: string[];
};

const RULES: KeywordRule[] = [
  {
    id: "route.customer_portal",
    category: "product_type",
    label: "Customer or client portal",
    patterns: [/\bportal\b/i, /\bclient\s+portal\b/i, /\bcustomer\s+portal\b/i, /\bdealer(?:ship)?s?\b/i],
    rationale: "The description emphasises a signed-in portal experience.",
    confidence: "high",
  },
  {
    id: "route.saas_multi_tenant",
    category: "product_type",
    label: "SaaS or multi-tenant product",
    patterns: [/\bsaas\b/i, /\bmulti[-\s]?tenant\b/i, /\btenants?\b/i, /\bsubscription\s+platform\b/i],
    rationale: "Language points to a multi-organisation product.",
    confidence: "high",
  },
  {
    id: "route.mobile_app",
    category: "product_type",
    label: "Mobile application",
    patterns: [/\bmobile\s+app\b/i, /\bios\b/i, /\bandroid\b/i, /\bapp\s+store\b/i],
    rationale: "Mobile application delivery is mentioned explicitly.",
    confidence: "high",
  },
  {
    id: "route.internal_system",
    category: "product_type",
    label: "Internal business system",
    patterns: [/\binternal\s+system\b/i, /\bback[-\s]?office\b/i, /\bops\s+tool\b/i, /\bstaff\s+tool\b/i],
    rationale: "The product appears aimed at internal operations.",
    confidence: "moderate",
  },
  {
    id: "route.custom_web_platform",
    category: "product_type",
    label: "Custom web platform",
    patterns: [/\bplatform\b/i, /\bweb\s+app(?:lication)?\b/i, /\bdashboard\b/i],
    rationale: "A custom web product or platform is described.",
    confidence: "moderate",
  },
  {
    id: "route.api_integration",
    category: "product_type",
    label: "API or integration",
    patterns: [/\bintegrat(?:e|ion)\b/i, /\bapi\b/i, /\bwebhook\b/i, /\bconnect(?:ing)?\s+systems\b/i],
    rationale: "Connecting systems or exposing APIs is central to the idea.",
    confidence: "moderate",
  },
  {
    id: "route.cloud_modernisation",
    category: "product_type",
    label: "Cloud or modernisation project",
    patterns: [/\bcloud\b/i, /\bmodernis(?:e|ation)\b/i, /\bmigrate\s+to\s+cloud\b/i, /\binfrastructure\b/i],
    rationale: "Cloud or modernisation work is referenced.",
    confidence: "moderate",
  },
  {
    id: "start.legacy_replacement",
    category: "starting_point",
    label: "Legacy system replacement",
    patterns: [/\blegacy\b/i, /\breplace\s+(?:an?\s+)?(?:old|existing)\s+system\b/i, /\brebuild\b/i],
    rationale: "Replacement of an older system is implied.",
    confidence: "high",
    relatedQuestionIds: ["q.context.starting_point", "q.followup.legacy.volume"],
  },
  {
    id: "start.existing_product",
    category: "starting_point",
    label: "Existing product extension",
    patterns: [/\bexisting\s+product\b/i, /\badd\s+features?\b/i, /\bextend\b/i],
    rationale: "Work appears to extend something already live.",
    confidence: "moderate",
    relatedQuestionIds: ["q.followup.existing.ownership"],
  },
  {
    id: "surface.customer_portal",
    category: "surface",
    label: "Authenticated customer portal",
    patterns: [/\bportal\b/i, /\bsigned[-\s]?in\b/i, /\blogin\b/i, /\bcustomer\s+account\b/i],
    rationale: "Users need authenticated access to their own workspace.",
    confidence: "high",
  },
  {
    id: "surface.admin_workspace",
    category: "surface",
    label: "Internal administration workspace",
    patterns: [/\badmin(?:istration)?\b/i, /\bback[-\s]?office\b/i, /\bmanage(?:ment)?\s+console\b/i],
    rationale: "Staff or administrators need an operational workspace.",
    confidence: "moderate",
  },
  {
    id: "surface.native_mobile",
    category: "surface",
    label: "iOS and Android mobile application",
    patterns: [/\bmobile\s+app\b/i, /\bios\b/i, /\bandroid\b/i],
    rationale: "Installed mobile apps are part of the described experience.",
    confidence: "high",
    relatedQuestionIds: ["q.followup.mobile.platform", "q.followup.mobile.stores"],
  },
  {
    id: "surface.public_api",
    category: "surface",
    label: "Public or partner API",
    patterns: [/\bpublic\s+api\b/i, /\bpartner\s+api\b/i, /\bexpose\s+an?\s+api\b/i],
    rationale: "An API surface is mentioned for partners or external systems.",
    confidence: "high",
  },
  {
    id: "surface.reporting",
    category: "surface",
    label: "Reporting and analytics environment",
    patterns: [/\breport(?:ing|s)?\b/i, /\banalytics\b/i, /\bdashboard\b/i],
    rationale: "Reporting or analytics appears in the description.",
    confidence: "moderate",
  },
  {
    id: "cap.access.registration_login",
    category: "capability",
    label: "Account registration and login",
    patterns: [/\blogin\b/i, /\bsign[\s-]?up\b/i, /\baccounts?\b/i, /\bauthenticat/i],
    rationale: "Users need accounts to use the product.",
    confidence: "high",
  },
  {
    id: "cap.access.kyc",
    category: "capability",
    label: "Identity verification or KYC",
    patterns: [/\bkyc\b/i, /\bidentity\s+verif/i, /\bonboarding\s+checks?\b/i, /\bid\s+document/i],
    rationale: "Identity verification is part of the described onboarding.",
    confidence: "high",
    relatedQuestionIds: ["q.followup.kyc.provider", "q.followup.kyc.documents"],
  },
  {
    id: "cap.access.role_permissions",
    category: "capability",
    label: "Role and permission management",
    patterns: [/\broles?\b/i, /\bpermissions?\b/i, /\brbac\b/i, /\bapprovers?\b/i],
    rationale: "Different people appear to need different access levels.",
    confidence: "moderate",
  },
  {
    id: "cap.workflow.multi_step",
    category: "capability",
    label: "Multi-step applications",
    patterns: [/\bapplication(?:s)?\b/i, /\bmulti[-\s]?step\b/i, /\bonboarding\s+flow\b/i],
    rationale: "A guided multi-step process is described.",
    confidence: "moderate",
  },
  {
    id: "cap.workflow.approvals",
    category: "capability",
    label: "Reviews and approvals",
    patterns: [/\bapprov(?:e|al|als)\b/i, /\breview\b/i, /\bworkflow\b/i],
    rationale: "Review or approval steps are part of the idea.",
    confidence: "moderate",
  },
  {
    id: "cap.workflow.status_tracking",
    category: "capability",
    label: "Status tracking",
    patterns: [/\btrack(?:ing)?\b/i, /\bstatus\b/i, /\bprogress\b/i],
    rationale: "Users need to follow progress through a process.",
    confidence: "moderate",
  },
  {
    id: "cap.payments.one_time",
    category: "capability",
    label: "One-time payments",
    patterns: [/\bpayment(?:s)?\b/i, /\bpay\b/i, /\bcheckout\b/i, /\bcard\s+payment\b/i],
    rationale: "Payment processing is mentioned.",
    confidence: "high",
    relatedQuestionIds: ["q.followup.payments.modes", "q.followup.payments.reconciliation"],
  },
  {
    id: "cap.payments.recurring",
    category: "capability",
    label: "Recurring billing",
    patterns: [/\brecurring\b/i, /\bmonthly\s+payment/i, /\bsubscription(?:s)?\b/i, /\bbilling\b/i],
    rationale: "Recurring or subscription billing language is present.",
    confidence: "high",
  },
  {
    id: "cap.payments.marketplace",
    category: "capability",
    label: "Marketplace transactions",
    patterns: [/\bmarketplace\b/i, /\bescrow\b/i, /\bsplit\s+payment/i, /\bpayouts?\b/i],
    rationale: "Marketplace or multi-party money movement is implied.",
    confidence: "high",
  },
  {
    id: "cap.data.files",
    category: "capability",
    label: "File and document management",
    patterns: [/\bupload\b/i, /\bdocuments?\b/i, /\bfiles?\b/i, /\battachments?\b/i],
    rationale: "Document or file handling is part of the workflow.",
    confidence: "high",
  },
  {
    id: "cap.data.signatures",
    category: "capability",
    label: "Digital signatures",
    patterns: [/\be[-\s]?sign/i, /\bdigital\s+signature/i, /\bsign\s+documents?\b/i],
    rationale: "Document signing is referenced.",
    confidence: "high",
  },
  {
    id: "cap.data.audit_history",
    category: "capability",
    label: "Audit history",
    patterns: [/\baudit\b/i, /\btraceability\b/i, /\bactivity\s+log\b/i],
    rationale: "Traceability or auditability is important.",
    confidence: "moderate",
  },
  {
    id: "cap.comms.email",
    category: "capability",
    label: "Email notifications",
    patterns: [/\bemail\s+notif/i, /\bnotify\b/i, /\bnotifications?\b/i],
    rationale: "Notifications are part of keeping users informed.",
    confidence: "low",
  },
  {
    id: "cap.comms.sms_whatsapp",
    category: "capability",
    label: "SMS or WhatsApp notifications",
    patterns: [/\bsms\b/i, /\bwhatsapp\b/i],
    rationale: "SMS or WhatsApp messaging is mentioned.",
    confidence: "high",
  },
  {
    id: "cap.ai.summaries",
    category: "capability",
    label: "AI-generated summaries",
    patterns: [/\bai\b/i, /\bllm\b/i, /\bsummar(?:y|ies|ise)\b/i, /\bgenerative\b/i],
    rationale: "AI-assisted summarisation or generation is referenced.",
    confidence: "moderate",
    relatedQuestionIds: ["q.followup.ai.human_review", "q.followup.ai.sensitivity"],
  },
  {
    id: "cap.ai.document_extraction",
    category: "capability",
    label: "Document extraction",
    patterns: [/\bocr\b/i, /\bextract(?:ion)?\b/i, /\bparse\s+documents?\b/i],
    rationale: "Extracting structured data from documents is described.",
    confidence: "high",
  },
  {
    id: "integration.payment_gateway",
    category: "integration",
    label: "Payment gateway",
    patterns: [/\bpayment\s+gateway\b/i, /\bstripe\b/i, /\bpayfast\b/i, /\bpeach\b/i, /\byoco\b/i],
    rationale: "A payment provider connection is likely required.",
    confidence: "high",
  },
  {
    id: "integration.accounting_erp",
    category: "integration",
    label: "Accounting or ERP",
    patterns: [/\berp\b/i, /\bxero\b/i, /\bsage\b/i, /\baccounting\b/i, /\bnetsuite\b/i],
    rationale: "Accounting or ERP connectivity is mentioned.",
    confidence: "high",
  },
  {
    id: "integration.crm",
    category: "integration",
    label: "CRM",
    patterns: [/\bcrm\b/i, /\bsalesforce\b/i, /\bhubspot\b/i],
    rationale: "CRM integration appears relevant.",
    confidence: "high",
  },
  {
    id: "integration.identity_credit",
    category: "integration",
    label: "Identity or credit provider",
    patterns: [/\bcredit\s+check\b/i, /\bidentity\s+provider\b/i, /\bkyc\s+provider\b/i],
    rationale: "Identity or credit checks suggest a specialist provider.",
    confidence: "moderate",
  },
  {
    id: "integration.government",
    category: "integration",
    label: "Government or regulatory service",
    patterns: [/\bgovernment\b/i, /\bregulator(?:y)?\b/i, /\bsars\b/i, /\bcipc\b/i],
    rationale: "A government or regulatory connection may be needed.",
    confidence: "moderate",
  },
  {
    id: "users.customers",
    category: "user_group",
    label: "Customers",
    patterns: [/\bcustomers?\b/i, /\bclients?\b/i, /\bend[\s-]?users?\b/i],
    rationale: "Customers or clients are primary users.",
    confidence: "moderate",
  },
  {
    id: "users.employees",
    category: "user_group",
    label: "Internal employees",
    patterns: [/\bemployees?\b/i, /\bstaff\b/i, /\binternal\s+users?\b/i],
    rationale: "Internal staff are expected to use the product.",
    confidence: "moderate",
  },
  {
    id: "users.tenants",
    category: "user_group",
    label: "Multiple client organisations or tenants",
    patterns: [/\btenants?\b/i, /\borganisations?\b/i, /\bdealerships?\b/i, /\bfranchis/i],
    rationale: "Multiple organisations appear to share the product.",
    confidence: "moderate",
  },
  {
    id: "quality.financial_info",
    category: "risk",
    label: "Financial information",
    patterns: [/\bfinanc(?:e|ial)\b/i, /\bloan\b/i, /\bpayment(?:s)?\b/i, /\binvoice(?:s)?\b/i],
    rationale: "Financial data handling raises assurance expectations.",
    confidence: "moderate",
    relatedQuestionIds: ["q.quality.requirements", "q.followup.regulated.controls"],
  },
  {
    id: "quality.popia_privacy",
    category: "risk",
    label: "POPIA or privacy obligations",
    patterns: [/\bpopia\b/i, /\bpersonal\s+data\b/i, /\bprivacy\b/i, /\bgdpr\b/i],
    rationale: "Personal data or privacy obligations are indicated.",
    confidence: "moderate",
  },
  {
    id: "quality.industry_compliance",
    category: "risk",
    label: "Industry-specific compliance",
    patterns: [/\bcompliance\b/i, /\bregulated\b/i, /\bfsic\b/i, /\blicen[cs]e\b/i],
    rationale: "Regulatory or compliance language is present.",
    confidence: "moderate",
    relatedQuestionIds: ["q.followup.regulated.controls"],
  },
  {
    id: "quality.payment_card_info",
    category: "risk",
    label: "Payment-card information",
    patterns: [/\bcard\s+data\b/i, /\bpci\b/i, /\bcredit\s+card\b/i],
    rationale: "Card data handling implies stronger security controls.",
    confidence: "high",
  },
  {
    id: "migration.multiple_sources",
    category: "risk",
    label: "Migration from existing data sources",
    patterns: [/\bmigrat(?:e|ion)\b/i, /\bimport\s+existing\b/i, /\blegacy\s+data\b/i],
    rationale: "Existing data may need to move into the new product.",
    confidence: "moderate",
    relatedQuestionIds: ["q.integrations.migration"],
  },
];

function normaliseIdea(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function toSuggestion(rule: KeywordRule): ClassifierSuggestion {
  return {
    id: rule.id,
    category: rule.category,
    label: rule.label,
    rationale: rule.rationale,
    confidence: rule.confidence,
    requiresConfirmation: true,
  };
}

/**
 * Classify free-text idea into taxonomy suggestions.
 * Deterministic and side-effect free — never returns prices.
 */
export function classifyIdeaKeywords(ideaText: string): IdeaClassificationResult {
  const text = normaliseIdea(ideaText);
  const suggestions: ClassifierSuggestion[] = [];
  const questionIds = new Set<string>();

  if (text.length < 12) {
    return {
      suggestions: [],
      questionsRequiringConfirmation: [
        "q.route.product_type",
        "q.context.starting_point",
        "q.surfaces.channels",
      ],
      notes: [
        "Add a little more detail about users, workflows, and integrations so we can suggest a useful starting shape.",
        "No prices are inferred from descriptions — estimates only come from confirmed scope.",
      ],
    };
  }

  for (const rule of RULES) {
    if (!rule.patterns.some((pattern) => pattern.test(text))) continue;
    if (suggestions.some((s) => s.id === rule.id)) continue;
    suggestions.push(toSuggestion(rule));
    for (const qid of rule.relatedQuestionIds ?? []) {
      questionIds.add(qid);
    }
  }

  // Always confirm route + surfaces when we inferred anything.
  if (suggestions.length > 0) {
    questionIds.add("q.route.product_type");
    questionIds.add("q.surfaces.channels");
    questionIds.add("q.cap.access");
  }

  if (suggestions.some((s) => s.category === "risk")) {
    questionIds.add("q.quality.requirements");
  }

  suggestions.sort((a, b) => {
    const rank = { high: 0, moderate: 1, low: 2 } as const;
    return rank[a.confidence] - rank[b.confidence] || a.label.localeCompare(b.label);
  });

  return {
    suggestions,
    questionsRequiringConfirmation: [...questionIds],
    notes: [
      "These are planning suggestions only. Confirm or correct each one before continuing.",
      "No investment range is generated from text alone.",
    ],
  };
}
