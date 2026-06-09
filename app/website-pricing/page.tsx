import type { Metadata } from "next";
import WebsitePricing from "@/components/website-pricing";

export const metadata: Metadata = {
  title: "Website Pricing",
  description:
    "Compare Good Code website packages, add-ons, hourly rates, monthly care plans, payment terms, and get a clear quote for your business website.",
};

export default function WebsitePricingPage() {
  return (
    <main>
      <WebsitePricing />
    </main>
  );
}
