import type { IntakeConcept, ProjectBlueprintAnswers } from "@/lib/project-blueprint/types";

export type FixtureBrief = {
  id:
    | "internalStaffJobTool"
    | "dealershipFinancePortal"
    | "nativeFieldApp"
    | "brochureWebsite"
    | "vagueApp";
  ideaText: string;
  concept: IntakeConcept;
  answers: ProjectBlueprintAnswers;
};

const internalConcept: IntakeConcept = {
  headline: "An internal staff job board",
  summary:
    "Staff log jobs, assign them, and track status in a simple internal workspace. No customer payments or outside systems in the first release.",
  whoItsFor: "Internal operations staff",
  coreCapabilities: ["Job logging", "Assignment", "Status tracking"],
  assumptions: ["First release is a signed-in staff workspace only."],
};

const portalConcept: IntakeConcept = {
  headline: "A dealership finance portal",
  summary:
    "Dealership staff upload finance applications, track status, receive documents, and collect monthly payments. Finance has an admin workspace. Web only, with personal and financial information.",
  whoItsFor: "Dealership staff and the finance team",
  coreCapabilities: [
    "Signed-in portal",
    "Application uploads",
    "Status tracking",
    "Monthly payments",
    "Finance admin workspace",
  ],
  assumptions: ["First release is web-only.", "A payment gateway is in scope."],
};

const nativeConcept: IntakeConcept = {
  headline: "A native field-service app",
  summary:
    "Field technicians log jobs on iOS and Android. There is no public website in the first release.",
  whoItsFor: "Field technicians",
  coreCapabilities: ["Native iOS app", "Native Android app", "Job logging"],
  assumptions: ["App-store submission is in scope.", "No public web app in the first release."],
};

export const FIXTURE_BRIEFS: Record<FixtureBrief["id"], FixtureBrief> = {
  internalStaffJobTool: {
    id: "internalStaffJobTool",
    ideaText:
      "An internal tool for staff to log jobs and assign them. No payments and no integrations with other systems.",
    concept: internalConcept,
    answers: {
      ideaText:
        "An internal tool for staff to log jobs and assign them. No payments and no integrations with other systems.",
      route: "route.internal_system",
      startingPoint: "start.new_idea",
      surfaces: ["surface.admin_workspace"],
      userGroups: ["users.employees"],
      capabilities: ["cap.workflow.status_tracking"],
      integrations: ["integration.none"],
      migrationProfile: "migration.none",
      qualityRequirements: [],
      unknowns: {},
    },
  },
  dealershipFinancePortal: {
    id: "dealershipFinancePortal",
    ideaText:
      "We need a signed-in customer portal for vehicle dealerships. Staff upload finance applications, track status, receive documents, and collect monthly payments. Finance needs an admin workspace. Web only. Validated concept. Payment gateway. Personal and financial information.",
    concept: portalConcept,
    answers: {
      ideaText:
        "We need a signed-in customer portal for vehicle dealerships. Staff upload finance applications, track status, receive documents, and collect monthly payments. Finance needs an admin workspace. Web only. Validated concept. Payment gateway. Personal and financial information.",
      route: "route.customer_portal",
      startingPoint: "start.validated_concept",
      surfaces: ["surface.customer_portal", "surface.admin_workspace"],
      userGroups: ["users.partners", "users.employees"],
      capabilities: [
        "cap.access.registration_login",
        "cap.workflow.status_tracking",
        "cap.payments.recurring",
        "cap.data.files",
      ],
      integrations: ["integration.payment_gateway"],
      qualityRequirements: ["quality.financial_info", "quality.personal_sensitive"],
      unknowns: {},
    },
  },
  nativeFieldApp: {
    id: "nativeFieldApp",
    ideaText:
      "A native iOS and Android app for field technicians to log jobs. No public website.",
    concept: nativeConcept,
    answers: {
      ideaText:
        "A native iOS and Android app for field technicians to log jobs. No public website.",
      route: "route.mobile_app",
      startingPoint: "start.new_idea",
      surfaces: ["surface.native_mobile"],
      userGroups: ["users.employees"],
      capabilities: ["cap.workflow.status_tracking"],
      integrations: ["integration.none"],
      migrationProfile: "migration.none",
      qualityRequirements: [],
      unknowns: {},
    },
  },
  brochureWebsite: {
    id: "brochureWebsite",
    ideaText:
      "We need a brochure marketing website and a landing page for the company.",
    concept: {
      headline: "A business website",
      summary: "A marketing site with a landing page.",
      whoItsFor: "Website visitors",
      coreCapabilities: [],
      assumptions: ["No custom product workflows."],
    },
    answers: {
      ideaText:
        "We need a brochure marketing website and a landing page for the company.",
      route: "route.website",
      surfaces: ["surface.public_web"],
      capabilities: [],
      integrations: ["integration.none"],
      unknowns: {},
    },
  },
  vagueApp: {
    id: "vagueApp",
    ideaText: "We need an app.",
    concept: {
      headline: "A custom app still being defined",
      summary: "The brief is only that an app is needed. Surfaces, users, and workflows are still open.",
      whoItsFor: "Not yet specified",
      coreCapabilities: [],
      assumptions: ["Scope is too thin for a tight planning number."],
    },
    answers: {
      ideaText: "We need an app.",
      route: "route.unsure",
      surfaces: [],
      capabilities: [],
      unknowns: {
        "q.surfaces.channels": "not_sure",
        "q.users.groups": "not_sure",
        "q.intake.payments": "not_sure",
      },
    },
  },
};

export const PORTAL_VS_INTERNAL_MIN_RATIO = 1.5;
