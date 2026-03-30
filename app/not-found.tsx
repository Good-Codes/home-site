// app/not-found.tsx
// ─── Why "use client"? ───────────────────────────────────────────────
// Framer Motion's <motion.*> components need browser APIs (DOM, layout
// measurements) so they can only run on the client. Adding "use client"
// tells Next.js to ship this component's JavaScript to the browser
// instead of rendering it entirely on the server.
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import MatrixBackground from "@/components/ui/matrix-background";

export default function NotFound() {
  // ─── Animation variants ────────────────────────────────────────────
  // This is the same pattern every other section on the site uses.
  // `hidden`  = the starting state (invisible, shifted 30 px down).
  // `visible` = the end state (fully opaque, original position).
  // The cubic-bezier ease [0.22, 1, 0.36, 1] gives a smooth deceleration.
  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    // ─── Full-screen wrapper ───────────────────────────────────────────
    // `relative isolate` creates a new stacking context so the
    //  MatrixBackground (positioned absolute) stays behind the text.
    // `min-h-[100vh]` ensures the section fills the viewport.
    // `flex items-center` vertically centres the content block.
    // This mirrors the layout used on the Thank You and Hero pages.
    <motion.section
      className="relative isolate w-full overflow-hidden bg-background min-h-[100vh] flex items-center"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* ── Matrix rain background ────────────────────────────────────
          The same animated canvas used on the Hero and Thank You pages.
          It renders behind everything thanks to a negative z-index
          inside the component.                                        */}
      <MatrixBackground />

      {/* Decorative layer (matches Hero / Thank You markup) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 flex justify-center"
      />

      {/* ── Centred content ───────────────────────────────────────────
          `container mx-auto px-6 text-center` is the same wrapper
          every page section uses for horizontal padding & centring.    */}
      <div className="container mx-auto px-6 text-center">

        {/* ── Icon + label row ────────────────────────────────────────
            This is the "icon inside a teal-tinted pill" pattern reused
            across Services, About, and Contact sections.
            • bg-[#67AFA7]/12  → 12 % opacity teal background
            • text-[#2f6f69]   → darker teal for the icon in light mode
            • dark:text-[#9ed9d2] → lighter teal in dark mode           */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#67AFA7]/12 text-[#2f6f69] dark:bg-[#67AFA7]/10 dark:text-[#9ed9d2]">
            <AlertTriangle className="h-7 w-7" aria-hidden />
          </div>

          {/* ── Uppercase teal label ──────────────────────────────────
              Same style as the "About" / "Best Fit" labels elsewhere.
              tracking-[0.22em] = extra letter-spacing for that
              small-caps look.                                         */}
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#67AFA7]">
            404 — Page Not Found
          </p>
        </div>

        {/* ── Main heading ────────────────────────────────────────────
            Uses the same classes as the Hero h1:
            text-5xl / md:text-7xl, font-bold, tracking-tight, and
            the standard light / dark text colours.                    */}
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-7xl">
          Oops, wrong turn
        </h1>

        {/* ── Supporting copy ─────────────────────────────────────────
            text-neutral-600 / dark:text-neutral-300 is the body-text
            colour used on every section of the site.                  */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
          The page you&apos;re looking for doesn&apos;t exist or the URL may be
          incorrect. Head back home or get in touch and we&apos;ll help you
          find what you need.
        </p>

        {/* ── Call-to-action buttons ──────────────────────────────────
            Reuses the shared <Button> component (shadcn/ui) with the
            same `size="lg"` seen on the Hero page.
            • Default variant = solid dark button (primary CTA).
            • Outline variant = bordered button (secondary CTA).
            The flex-wrap + gap-4 layout matches the Hero's CTA row.   */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/">
            <Button size="lg">Back to Home</Button>
          </Link>
          <Link href="/contact-us">
            <Button variant="outline" size="lg">Contact Us</Button>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}