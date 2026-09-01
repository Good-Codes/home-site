import type { Metadata } from "next";
import WebsitePricing from "@/components/website-pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose website packages or estimate a custom software product with Project Blueprint. Clear website pricing and indicative custom-product planning ranges from Good Code.",
};

export default function WebsitePricingPage() {
  return (
    <main>
      <WebsitePricing />
    </main>
  );
}
