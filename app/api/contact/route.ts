import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_LIMITS = {
  name: 120,
  email: 254,
  phone: 50,
  details: 5_000,
} as const;

type ContactSubmission = {
  name: string;
  email: string;
  phone: string;
  details: string;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseSubmission(body: unknown):
  | { success: true; data: ContactSubmission }
  | { success: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "Invalid form submission." };
  }

  const values = body as Record<string, unknown>;
  const submission = {
    name: getString(values.name).replace(/\s+/g, " "),
    email: getString(values.email),
    phone: getString(values.phone).replace(/\s+/g, " "),
    details: getString(values.details),
  };

  if (!submission.name || !submission.email || !submission.details) {
    return {
      success: false,
      error: "Name, email, and project details are required.",
    };
  }

  if (!EMAIL_PATTERN.test(submission.email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const fieldTooLong = (
    Object.keys(FIELD_LIMITS) as Array<keyof ContactSubmission>
  ).some((field) => submission[field].length > FIELD_LIMITS[field]);

  if (fieldTooLong) {
    return { success: false, error: "One or more fields are too long." };
  }

  return { success: true, data: submission };
}

function buildEmail({ name, email, phone, details }: ContactSubmission) {
  const contact = phone ? `${email}, ${phone}` : email;
  const text = `${name} (${contact}) has reached out regarding the following project:\n\n${details}`;

  return {
    subject: `New project enquiry from ${name}`,
    text,
    html: `
      <!doctype html>
      <html lang="en">
        <body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#171717;">
          <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
            <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:32px;">
              <p style="margin:0 0 24px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#2f6f69;">Good Code website lead</p>
              <h1 style="margin:0 0 24px;font-size:26px;line-height:1.25;">New project enquiry</h1>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">
                <strong>${escapeHtml(name)}</strong> (<a href="mailto:${escapeHtml(email)}" style="color:#2f6f69;">${escapeHtml(email)}</a>${phone ? `, ${escapeHtml(phone)}` : ""}) has reached out regarding the following project:
              </p>
              <div style="padding:20px;border-left:4px solid #67afa7;background:#f7fbfa;font-size:16px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(details)}</div>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#737373;">Reply to this email to contact ${escapeHtml(name)} directly.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid form submission." },
      { status: 400 },
    );
  }

  const submission = parseSubmission(body);

  if (!submission.success) {
    return NextResponse.json({ error: submission.error }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONTACT_EMAIL_FROM?.trim();
  const to = process.env.CONTACT_EMAIL_TO?.trim();

  if (!apiKey || !from || !to) {
    console.error(
      "Contact email is not configured. RESEND_API_KEY, CONTACT_EMAIL_FROM, and CONTACT_EMAIL_TO are required.",
    );
    return NextResponse.json(
      { error: "The contact form is temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  const { name, email } = submission.data;
  const emailContent = buildEmail(submission.data);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    if (error) {
      console.error("Resend rejected the contact email:", {
        name: error.name,
        statusCode: error.statusCode,
        message: error.message,
      });
      return NextResponse.json(
        { error: "We could not send your message. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { message: `Thanks, ${name}. Your message has been sent.` },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Unexpected error while sending the contact email:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "We could not send your message. Please try again." },
      { status: 502 },
    );
  }
}
