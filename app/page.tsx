// page.tsx
import React from 'react';
import type { Metadata } from "next";
import Hero from "../components/hero"
import Services from '@/components/services';
import AboutLink from '@/components/about-link';

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
      <AboutLink />
    </main>
  );
}