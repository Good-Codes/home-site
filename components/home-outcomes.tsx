"use client";

import Link from "next/link";
import { ArrowUpRight, Gauge, LockKeyhole, Network, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const outcomes: Outcome[] = [
  {
    title: "Operations become clearer",
    description:
      "Teams get cleaner workflows, better visibility, and less manual coordination across the systems they rely on every day.",
    Icon: Workflow,
  },
  {
    title: "Platforms feel dependable",
    description:
      "Delivery practices, infrastructure, and testing support calmer releases and fewer avoidable surprises after launch.",
    Icon: Gauge,
  },
  {
    title: "Sensitive flows are treated carefully",
    description:
      "Payments, onboarding, identity checks, banking workflows, and integrations are designed with control and reliability in mind.",
    Icon: LockKeyhole,
  },
  {
    title: "Systems can evolve",
    description:
      "Architecture and code choices leave room for future teams, new features, cloud migration, and product growth.",
    Icon: Network,
  },
];

type Outcome = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

export default function HomeOutcomes() {
  const prefersReducedMotion = useReducedMotion();
  const transition = {
    duration: 0.7,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  };
  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition,
      };

  return (
    <section className="border-y border-neutral-200 bg-white py-24 text-neutral-950 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-100 sm:py-28">
      <div className="container mx-auto max-w-7xl px-6">
        <motion.div
          {...motionProps}
          className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(20rem,0.38fr)] lg:items-end"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
              Proof through outcomes
            </p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-neutral-950 dark:text-white sm:text-5xl">
              The work is measured by what becomes easier after launch.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-neutral-700 dark:text-neutral-300">
            Our delivery history spans dealership finance, crowdfunding, banking, payment modules, cloud platforms, and test automation. The common thread is practical software that improves how teams operate.
          </p>
        </motion.div>

        <motion.div
          {...motionProps}
          transition={prefersReducedMotion ? undefined : { ...transition, delay: 0.08 }}
          className="mt-14 grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 dark:border-white/10 dark:bg-white/10 md:grid-cols-2"
        >
          {outcomes.map(({ title, description, Icon }) => (
            <article key={title} className="bg-white p-6 dark:bg-neutral-950 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-8 text-2xl font-semibold text-neutral-950 dark:text-white">
                {title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-neutral-700 dark:text-neutral-300">
                {description}
              </p>
            </article>
          ))}
        </motion.div>

        <motion.div
          {...motionProps}
          className="mt-10"
        >
          <Link
            href="/our-projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2f6f69] transition hover:text-[#1f5550] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7] focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:text-[#9ed9d2] dark:hover:text-white dark:focus-visible:ring-offset-neutral-950"
          >
            View selected projects
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
