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
      className="relative isolate overflow-hidden border-b border-neutral-200 bg-white py-24 text-neutral-950 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-100 sm:py-28"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.42fr_minmax(0,0.7fr)] lg:items-start">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300">
              <HelpCircle className="h-5 w-5" aria-hidden />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
              About Good Code
            </p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-neutral-950 dark:text-white sm:text-5xl">
              Restoring trust in technology.
            </h2>
          </div>

          <div>
            <p className="max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
              Good Code was founded to bridge the widening gap between business expectations and technical delivery. Too often, that gap is filled with complexity, inflated costs, and unclear ownership.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
              Our purpose is to remove the black box from development. We believe technical excellence and moral clarity belong together: clear tradeoffs, reliable delivery, and software clients can understand.
            </p>

            <Button
              variant="outline"
              size="lg"
              className="mt-9 border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-white/[0.06]"
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
        </div>
      </div>
    </motion.section>
  );
}

