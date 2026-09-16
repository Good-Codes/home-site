import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  checkAuthRateLimit,
  clientKeyFromRequest,
} from "@/lib/auth/rate-limit";
import {
  buildContactEnquiryEmail,
  resolveContactEnquiry,
} from "@/lib/email/contact";
import { sendContactEnquiryEmail } from "@/lib/email/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const key = `contact:${clientKeyFromRequest(request)}`;
  if (!checkAuthRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a few minutes." },
      { status: 429 },
    );
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
