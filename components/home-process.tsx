"use client";

import { Code2, Compass, MessageSquare, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const steps: ProcessStep[] = [
  {
    title: "Understand the real problem",
    description:
      "We start with the business context, users, constraints, and the decisions the product needs to support.",
    Icon: Compass,
  },
  {
    title: "Shape a clear path",
    description:
      "We turn loose ideas into a practical roadmap: scope, technical direction, milestones, risks, and the first useful release.",
    Icon: MessageSquare,
  },
  {
    title: "Build with discipline",
    description:
      "Design and engineering move together, with accessible interfaces, maintainable code, secure integrations, and regular review.",
    Icon: Code2,
  },
  {
    title: "Launch and keep improving",
    description:
      "We support the product after release with hosting, monitoring, iteration, and the small decisions that keep systems dependable.",
    Icon: Rocket,
  },
];

type ProcessStep = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

export default function HomeProcess() {
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
    <section className="bg-white py-24 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100 sm:py-28">
      <div className="container mx-auto max-w-7xl px-6">
        <motion.div
          {...motionProps}
          className="grid gap-10 lg:grid-cols-[0.42fr_minmax(0,0.75fr)] lg:items-start"
        >
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
              How we work
            </p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-neutral-950 dark:text-white sm:text-5xl">
              Calm process. Clear decisions. Better software.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-neutral-600 dark:text-neutral-300">
              The best digital products feel simple because the hard thinking has already happened. We keep the work visible, structured, and grounded in what the product must achieve.
            </p>
          </div>

          <div className="border-y border-neutral-200 dark:border-white/10">
            {steps.map(({ title, description, Icon }, index) => (
              <motion.article
                key={title}
                {...motionProps}
                transition={prefersReducedMotion ? undefined : { ...transition, delay: index * 0.06 }}
                className="grid gap-5 border-b border-neutral-200 py-8 last:border-b-0 dark:border-white/10 sm:grid-cols-[4rem_minmax(0,1fr)] sm:py-10"
              >
                <div className="flex items-center gap-4 sm:block">
                  <span className="font-mono text-sm text-neutral-400 dark:text-neutral-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300 sm:mt-6">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-neutral-950 dark:text-white">
                    {title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
                    {description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
