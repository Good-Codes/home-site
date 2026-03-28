import React from "react";
import type { Metadata } from "next";
import ThankYou from "../../components/thank-you";

export const metadata: Metadata = {
  title: "Thank You",
  description: "Your message has been sent. The Good Code team will be in touch shortly.",
  // Tell search engines NOT to index this page — it has no content
  // worth ranking for and would waste your crawl budget.
  robots: { index: false, follow: true },
};

export default function ThankYouPage() {
    return (
        <main>
          <ThankYou />
        </main>
    );
}
