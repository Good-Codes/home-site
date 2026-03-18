// about.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * About section – conveys Good Code's story, ethos, and differentiators.
 * Layout with generous whitespace, subtle depth, and animated highlights.
 */
export default function About() {
  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.section
      id="about"
      className="relative isolate overflow-hidden bg-neutral-50 pt-24 pb-12 dark:bg-neutral-950"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container mx-auto max-w-3xl px-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#67AFA7]/12 text-[#2f6f69] dark:bg-[#67AFA7]/10 dark:text-[#9ed9d2]">
            <HelpCircle className="h-7 w-7" aria-hidden />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#67AFA7]">
              About
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              Crafting Code That Feels Invisible
            </h2>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
          Good Code partners with startups and established teams to design, build,
          and scale dependable digital products. From initial strategy through
          delivery and beyond, we create web, mobile, and cloud solutions that are
          fast, maintainable, and tied to clear business outcomes.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
          We prioritise transparency at every stage—keeping you informed with
          regular progress updates and honest communication. Our senior‑led team
          brings deep technical expertise across the full stack, so whether you
          need a customer‑facing application, internal tooling, or cloud
          infrastructure, we deliver work you can rely on.
        </p>

        <Button
          variant="outline"
          size="lg"
          className="mt-10"
          onClick={() => {
            const target = document.getElementById("team");
            if (target) {
              const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 112);
              window.scrollTo({ top, behavior: "smooth" });
            }
          }}
        >
          Meet the Team
          <ChevronDown className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </motion.section>
  );
}

