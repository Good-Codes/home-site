import type { Metadata } from "next";

import AboutLink from "@/components/about-link";
import Hero from "@/components/hero";
import HomeFinalCta from "@/components/home-final-cta";
import HomeOutcomes from "@/components/home-outcomes";
import HomeProcess from "@/components/home-process";
import Services from "@/components/services";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Good Code builds web, mobile, and cloud solutions for startups and enterprises in South Africa. Explore our services and get a free quote.",
};

export default function Page() {
  return (
    <main>
      <Hero />
      <Services />
      <HomeProcess />
      <HomeOutcomes />
      <AboutLink />
      <HomeFinalCta />
    </main>
  );
}
