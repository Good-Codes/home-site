import "server-only";

export type SendEstimateEmailInput = {
  to: string;
  estimateId: string;
  accountUrl: string;
  summaryLine: string;
  idempotencyKey?: string;
};

export type SendEstimateEmailResult =
  | { ok: true; messageId: string; stub: boolean }
  | { ok: false; error: string; code: "EMAIL_UNAVAILABLE" | "SEND_FAILED" };

/**
 * Send a planning-estimate email via Resend.
 * Stub: returns a no-op success when RESEND_API_KEY is unset.
 */
export async function sendEstimateEmail(
  input: SendEstimateEmailInput,
): Promise<SendEstimateEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "estimates@goodcode.co.za";

  if (!apiKey) {
    console.info("[PLACEHOLDER] sendEstimateEmail stub — RESEND_API_KEY unset", {
      to: input.to,
      estimateId: input.estimateId,
    });
    return {
      ok: true,
      messageId: `stub-${input.estimateId}-${Date.now()}`,
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
        subject: "Your Project Blueprint planning estimate",
        html: `
          <p>Here is your indicative Project Blueprint planning estimate.</p>
          <p>${input.summaryLine}</p>
          <p><a href="${input.accountUrl}">Sign in to your account</a> if you need to continue this estimate later.</p>
          <p>This is a planning estimate, not a fixed quotation. A Good Code specialist reviews scope before any formal quote.</p>
        `,
        text: `Your Project Blueprint planning estimate\n\n${input.summaryLine}\n\nSign in: ${input.accountUrl}\n\nThis is a planning estimate, not a fixed quotation.`,
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
    console.error("sendEstimateEmail failed", error);
    return {
      ok: false,
      error: "Unable to send estimate email.",
      code: "SEND_FAILED",
    };
  }
}
