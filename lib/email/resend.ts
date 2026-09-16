import "server-only";

import { DEFAULT_CONTACT_INBOX } from "@/lib/email/constants";
import { runtimeEnv } from "@/lib/env/runtime";

export { DEFAULT_CONTACT_INBOX };

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  idempotencyKey?: string;
};

export type SendEmailResult =
  | { ok: true; messageId: string; stub: boolean }
  | { ok: false; error: string; code: "EMAIL_UNAVAILABLE" | "SEND_FAILED" };

function defaultFromAddress(): string {
  return runtimeEnv("RESEND_FROM_EMAIL") || "estimates@goodcode.co.za";
}

export function contactFromAddress(): string {
  return runtimeEnv("CONTACT_EMAIL_FROM") || defaultFromAddress();
}

export function contactToAddress(): string {
  return runtimeEnv("CONTACT_EMAIL_TO") || DEFAULT_CONTACT_INBOX;
}

/**
 * Send transactional email via Resend.
 * Stub: returns a no-op success when RESEND_API_KEY is unset so local/e2e still work.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = runtimeEnv("RESEND_API_KEY");
  const from = input.from?.trim() || defaultFromAddress();

  if (!apiKey) {
    console.info("[email] sendEmail stub — RESEND_API_KEY unset", {
      to: input.to,
      subject: input.subject,
    });
    return {
      ok: true,
      messageId: `stub-${Date.now()}`,
      stub: true,
    };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const result = await resend.emails.send(
      {
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      },
      input.idempotencyKey
        ? { idempotencyKey: input.idempotencyKey }
        : undefined,
    );

    if (result.error) {
      return {
        ok: false,
        error: result.error.message,
        code: "SEND_FAILED",
      };
    }

    return {
      ok: true,
      messageId: result.data?.id ?? `sent-${Date.now()}`,
      stub: false,
    };
  } catch (error) {
    console.error("sendEmail failed", error);
    return {
      ok: false,
      error: "Unable to send email.",
      code: "SEND_FAILED",
    };
  }
}

export type SendPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
  idempotencyKey?: string;
};

export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput,
): Promise<SendEmailResult> {
  return sendEmail({
    to: input.to,
    subject: "Reset your Good Code password",
    html: `
      <p>We received a request to reset the password for your Good Code account.</p>
      <p><a href="${input.resetUrl}">Choose a new password</a>. This link expires in one hour.</p>
      <p>If you did not ask for this, you can ignore this email. Your password will stay the same.</p>
    `,
    text: `Reset your Good Code password\n\n${input.resetUrl}\n\nThis link expires in one hour. If you did not ask for this, ignore this email.`,
    idempotencyKey: input.idempotencyKey,
  });
}

export type SendContactEnquiryEmailInput = {
  replyTo: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendContactEnquiryEmail(
  input: SendContactEnquiryEmailInput,
): Promise<SendEmailResult> {
  return sendEmail({
    from: contactFromAddress(),
    to: contactToAddress(),
    replyTo: input.replyTo,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
