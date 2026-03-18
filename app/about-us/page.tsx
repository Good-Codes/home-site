// app/about/page.tsx
import React from "react";
import About from "@/components/about";
import Team from "@/components/team";
import Footer from "@/components/footer";

export default function AboutPage() {
  return (
    <main>
      <About />
      <Team />
    </main>
  );
}