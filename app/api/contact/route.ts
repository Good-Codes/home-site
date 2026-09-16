import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { AUTH_RATE_LIMIT_WINDOW_MS } from "@/lib/auth/constants";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";
import {
  buildContactEnquiryEmail,
  isContactHoneypotFilled,
  resolveContactEnquiry,
} from "@/lib/email/contact";
import {
  CONTACT_RATE_LIMIT_EMAIL_MAX_HITS,
  CONTACT_RATE_LIMIT_MAX_HITS,
} from "@/lib/email/constants";
import { sendContactEnquiryEmail } from "@/lib/email/resend";
import { isAllowedRequestOrigin } from "@/lib/http/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RETRY_AFTER_SECONDS = Math.ceil(AUTH_RATE_LIMIT_WINDOW_MS / 1000);

function tooManyMessages() {
  return NextResponse.json(
    { error: "Too many messages. Please wait a few minutes." },
    {
      status: 429,
      headers: { "Retry-After": String(RETRY_AFTER_SECONDS) },
    },
  );
}

export async function POST(request: Request) {
  if (!isAllowedRequestOrigin(request)) {
    return NextResponse.json(
      { error: "This request could not be verified." },
      { status: 403 },
    );
  }

  const clientKey = clientKeyFromRequest(request);
  const ipKey = `contact:${clientKey}`;
  if (!checkAuthRateLimit(ipKey, CONTACT_RATE_LIMIT_MAX_HITS)) {
    return tooManyMessages();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid form submission." },
      { status: 400 },
    );
  }

  if (isContactHoneypotFilled(body)) {
    return NextResponse.json(
      { message: "Thanks. Your message has been sent." },
      { status: 200 },
    );
  }

  const session = await auth();
  const enquiry = await resolveContactEnquiry(
    body,
    session?.user?.id
      ? { id: session.user.id, role: session.user.role }
      : null,
  );

  if (!enquiry.success) {
    return NextResponse.json(
      { error: enquiry.error },
      { status: enquiry.status },
    );
  }

  const emailKey = `contact:email:${enquiry.data.email.trim().toLowerCase()}`;
  if (!checkAuthRateLimit(emailKey, CONTACT_RATE_LIMIT_EMAIL_MAX_HITS)) {
    return tooManyMessages();
  }

  const emailContent = buildContactEnquiryEmail(enquiry.data);
  const sent = await sendContactEnquiryEmail({
    replyTo: enquiry.data.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });

  if (!sent.ok) {
    console.error("contact email failed", sent.error);
    return NextResponse.json(
      { error: "We could not send your message. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      message: `Thanks, ${enquiry.data.name}. Your message has been sent.`,
    },
    { status: 200 },
  );
}
