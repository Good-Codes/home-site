import "server-only";

import {
  getOwnedCalculatedEstimate,
  listSavedEstimates,
  summarizePublicResult,
} from "@/lib/account/estimates";
import { isStaffRole } from "@/lib/auth/roles";
import { isDatabaseConfigured, prisma } from "@/lib/db";
import {
  CONTACT_HONEYPOT_FIELD,
  CONTACT_NO_ESTIMATE,
} from "@/lib/email/constants";
import { parseIntakeConcept } from "@/lib/project-blueprint/types";
import {
  escapeHtml,
  sanitizePersonName,
  sanitizePlainText,
} from "@/lib/security/text";

export { CONTACT_NO_ESTIMATE };

export const FIELD_LIMITS = {
  name: 120,
  email: 254,
  phone: 50,
  details: 5_000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ContactEstimateSnippet = {
  referenceId: string;
  productSummary: string;
  summary: string;
  whoItsFor: string;
};

export type ContactEnquiry = {
  name: string;
  email: string;
  phone: string;
  details: string;
  estimate: ContactEstimateSnippet | null;
  fromAccount: boolean;
};

export type ContactSession = {
  id: string;
  role: string | null | undefined;
};

export type ResolveContactResult =
  | { success: true; data: ContactEnquiry }
  | { success: false; error: string; status: 400 | 404 };

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function isContactHoneypotFilled(body: unknown): boolean {
  const values = asRecord(body);
  if (!values) return false;
  return getString(values[CONTACT_HONEYPOT_FIELD]).length > 0;
}

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }
  return body as Record<string, unknown>;
}

function conceptFromEstimate(estimate: {
  concept: unknown;
  results: { publicResult: unknown }[];
}) {
  const fromRow = parseIntakeConcept(estimate.concept);
  if (fromRow) return fromRow;
  const publicResult = estimate.results[0]?.publicResult;
  if (publicResult && typeof publicResult === "object" && "concept" in publicResult) {
    return parseIntakeConcept(
      (publicResult as { concept: unknown }).concept,
    );
  }
  return undefined;
}

export function estimateSnippetFromRecord(estimate: {
  id: string;
  concept: unknown;
  results: { publicResult: unknown }[];
}): ContactEstimateSnippet | null {
  const latest = estimate.results[0]?.publicResult;
  if (!latest) return null;
  const summary = summarizePublicResult(latest);
  const concept = conceptFromEstimate(estimate);
  return {
    referenceId: estimate.id,
    productSummary: summary.productSummary,
    summary: concept?.summary ?? "",
    whoItsFor: concept?.whoItsFor ?? "",
  };
}

function parseGuestEnquiry(
  values: Record<string, unknown>,
): ResolveContactResult {
  const rawName = getString(values.name);
  const rawEmail = getString(values.email);
  const rawPhone = getString(values.phone);
  const rawDetails = getString(values.details);

  if (
    rawName.length > FIELD_LIMITS.name ||
    rawEmail.length > FIELD_LIMITS.email ||
    rawPhone.length > FIELD_LIMITS.phone ||
    rawDetails.length > FIELD_LIMITS.details
  ) {
    return { success: false, error: "One or more fields are too long.", status: 400 };
  }

  const submission = {
    name: sanitizePersonName(rawName, FIELD_LIMITS.name),
    email: rawEmail,
    phone: sanitizePlainText(rawPhone, {
      maxLength: FIELD_LIMITS.phone,
    }),
    details: sanitizePlainText(rawDetails, {
      maxLength: FIELD_LIMITS.details,
      keepNewlines: true,
      collapseWhitespace: true,
    }),
  };

  if (!submission.name || !submission.email || !submission.details) {
    return {
      success: false,
      error: "Name, email, and project details are required.",
      status: 400,
    };
  }

  if (!EMAIL_PATTERN.test(submission.email)) {
    return { success: false, error: "Please enter a valid email address.", status: 400 };
  }

  return {
    success: true,
    data: {
      ...submission,
      estimate: null,
      fromAccount: false,
    },
  };
}

function requestedEstimateId(values: Record<string, unknown>): string | null {
  const raw = getString(values.estimateId);
  if (!raw || raw === CONTACT_NO_ESTIMATE) return null;
  return raw;
}

export async function resolveContactEnquiry(
  body: unknown,
  session: ContactSession | null,
): Promise<ResolveContactResult> {
  const values = asRecord(body);
  if (!values) {
    return { success: false, error: "Invalid form submission.", status: 400 };
  }

  const customerId =
    session?.id && !isStaffRole(session.role ?? "CUSTOMER") ? session.id : null;

  if (!customerId || !isDatabaseConfigured()) {
    return parseGuestEnquiry(values);
  }

  const savedEstimates = await listSavedEstimates(customerId);
  if (savedEstimates.length === 0) {
    return parseGuestEnquiry(values);
  }

  const user = await prisma.user.findUnique({
    where: { id: customerId },
    select: { name: true, email: true, phone: true },
  });
  if (!user?.email) {
    return parseGuestEnquiry(values);
  }

  const estimateId = requestedEstimateId(values);
  if (estimateId && !UUID_PATTERN.test(estimateId)) {
    return { success: false, error: "Estimate not found.", status: 404 };
  }

  let estimate: ContactEstimateSnippet | null = null;
  if (estimateId) {
    const owned = await getOwnedCalculatedEstimate({
      userId: customerId,
      estimateId,
      requireSavedToProfile: true,
    });
    const snippet = owned ? estimateSnippetFromRecord(owned) : null;
    if (!snippet) {
      return { success: false, error: "Estimate not found.", status: 404 };
    }
    estimate = snippet;
  }

  const rawDetails = getString(values.details);
  if (rawDetails.length > FIELD_LIMITS.details) {
    return { success: false, error: "One or more fields are too long.", status: 400 };
  }
  const details = sanitizePlainText(rawDetails, {
    maxLength: FIELD_LIMITS.details,
    keepNewlines: true,
    collapseWhitespace: true,
  });
  if (!estimate && !details) {
    return {
      success: false,
      error: "Please describe the project you want to talk about.",
      status: 400,
    };
  }

  return {
    success: true,
    data: {
      name:
        sanitizePersonName(user.name ?? "") || "Good Code customer",
      email: user.email,
      phone: user.phone
        ? sanitizePlainText(user.phone, { maxLength: FIELD_LIMITS.phone })
        : "",
      details,
      estimate,
      fromAccount: true,
    },
  };
}

export function buildContactEnquiryEmail(enquiry: ContactEnquiry) {
  const contact = enquiry.phone
    ? `${enquiry.email}, ${enquiry.phone}`
    : enquiry.email;
  const estimate = enquiry.estimate;

  const estimateText = estimate
    ? [
        `Reference: ${estimate.referenceId}`,
        estimate.productSummary,
        estimate.summary,
        estimate.whoItsFor ? `For: ${estimate.whoItsFor}` : "",
      ]
        .filter((line) => line.length > 0)
        .join("\n\n")
    : "";

  const intro = estimate
    ? `${enquiry.name} (${contact}) has reached out about a saved planning estimate.`
    : `${enquiry.name} (${contact}) has reached out regarding the following project:`;

  const extra =
    estimate && enquiry.details
      ? `\n\nAdditional notes:\n\n${enquiry.details}`
      : enquiry.details
        ? `\n\n${enquiry.details}`
        : "";

  const text = `${intro}\n\n${estimateText}${extra}`.trim();

  const estimateHtml = estimate
    ? `
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#525252;">
        Reference ${escapeHtml(estimate.referenceId)}
      </p>
      <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${escapeHtml(estimate.productSummary)}</h2>
      ${
        estimate.summary
          ? `<p style="margin:0 0 12px;font-size:16px;line-height:1.6;">${escapeHtml(estimate.summary)}</p>`
          : ""
      }
      ${
        estimate.whoItsFor
          ? `<p style="margin:0;font-size:14px;line-height:1.6;color:#525252;">For: ${escapeHtml(estimate.whoItsFor)}</p>`
          : ""
      }
    `
    : "";

  const detailsHtml = enquiry.details
    ? `<div style="padding:20px;border-left:4px solid #67afa7;background:#f7fbfa;font-size:16px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(enquiry.details)}</div>`
    : "";

  const subject = estimate
    ? `Estimate enquiry from ${enquiry.name}: ${estimate.productSummary}`
    : `New project enquiry from ${enquiry.name}`;

  return {
    subject,
    text,
    html: `
      <!doctype html>
      <html lang="en">
        <body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#171717;">
          <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
            <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:32px;">
              <p style="margin:0 0 24px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#2f6f69;">Good Code website lead</p>
              <h1 style="margin:0 0 24px;font-size:26px;line-height:1.25;">${
                estimate ? "Planning estimate enquiry" : "New project enquiry"
              }</h1>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">
                <strong>${escapeHtml(enquiry.name)}</strong> (<a href="mailto:${escapeHtml(enquiry.email)}" style="color:#2f6f69;">${escapeHtml(enquiry.email)}</a>${enquiry.phone ? `, ${escapeHtml(enquiry.phone)}` : ""}) ${
                  estimate
                    ? "has reached out about a saved planning estimate:"
                    : "has reached out regarding the following project:"
                }
              </p>
              ${estimateHtml}
              ${detailsHtml}
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#737373;">Reply to this email to contact ${escapeHtml(enquiry.name)} directly.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
