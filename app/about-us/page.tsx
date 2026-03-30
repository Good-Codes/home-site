// app/about/page.tsx
import React from "react";
import type { Metadata } from "next";
import About from "@/components/about";
import Team from "@/components/team";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Meet the team behind Good Code. Learn about our mission, expertise, and approach to building dependable digital products.",
};

export default function AboutPage() {
  return (
    <main>
      <About />
      <Team />
    </main>
  );
}