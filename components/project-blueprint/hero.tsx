"use client";

import { ArrowRight, MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { smoothEase } from "@/lib/motion";
import { BrandButton, SectionHeading } from "./ui";

type ProjectBlueprintHeroProps = {
  onStart: () => void;
};

export function ProjectBlueprintHero({ onStart }: ProjectBlueprintHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 0%, rgba(103,175,167,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 20%, rgba(103,175,167,0.08), transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(103,175,167,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(103,175,167,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
        }}
      />

      <div className="container relative mx-auto max-w-7xl px-6 pb-16 pt-10 sm:pb-20 sm:pt-14 lg:pt-16">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: smoothEase }}
          className="max-w-3xl"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
            Project Blueprint
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] text-neutral-950 dark:text-white sm:text-5xl lg:text-6xl">
            Custom Software Cost Estimator
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-neutral-800 dark:text-neutral-200">
            Describe the product. Get a planning range.
          </p>
          <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
            Tell us what you want to make possible — in your own words. We infer
            the product shape, ask a few follow-ups only if something important
            is missing, and return a realistic budget range and delivery window.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            A planning estimate, not a fixed quote. Complex projects are reviewed
            by a Good Code specialist before a formal quotation is issued.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <BrandButton onClick={onStart} className="group">
              Start my estimate
              <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </BrandButton>
            <BrandButton href="/contact-us" variant="outline">
              Talk to the team
              <MessageCircle className="ml-2 h-4 w-4" aria-hidden />
            </BrandButton>
          </div>
        </motion.div>

        <motion.div
          className="mt-14 max-w-3xl border-t border-neutral-200 pt-8 dark:border-white/10"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: 0.5 }}
        >
          <SectionHeading
            align="left"
            eyebrow="What you receive"
            title="An indicative plan you can act on"
            description="Investment range, delivery window, cost drivers, assumptions, and a clear next step — before we ask for contact details."
            className="max-w-2xl"
          />
        </motion.div>
      </div>
    </section>
  );
}
