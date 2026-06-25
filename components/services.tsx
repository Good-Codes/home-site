"use client";

import Link from "next/link";
import { ArrowRight, Cloud, Code, LifeBuoy, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { smoothEase } from "@/lib/motion";

const services: Service[] = [
  {
    id: "web-development",
    eyebrow: "Web platforms",
    title: "Web Development",
    desc: "Fast, polished websites and web applications built to explain, sell, and scale.",
    detail:
      "We build marketing sites, customer portals, and custom web applications that balance clear UX, strong performance, and room to grow with your business.",
    highlights: [
      "Responsive interfaces shaped around your brand, conversion goals, and customer journeys.",
      "Accessible frontends, technical SEO, analytics, and performance foundations from day one.",
      "CMS, payment, workflow, and third-party API integrations that fit how your team operates.",
    ],
    bestFit:
      "Ideal when you need a refined digital presence or a product-ready platform that can scale without constant rework.",
    Icon: Code,
  },
  {
    id: "mobile-app-development",
    eyebrow: "Mobile products",
    title: "Mobile App Development",
    desc: "iOS and Android experiences that feel focused, reliable, and easy to return to.",
    detail:
      "We design and develop mobile experiences that feel natural on-device, perform reliably, and keep users engaged across the moments that matter.",
    highlights: [
      "Cross-platform or platform-specific delivery based on your product and budget realities.",
      "User flows refined for onboarding, retention, and everyday usability.",
      "Secure API connectivity, notifications, and offline-friendly behavior where the product needs it.",
    ],
    bestFit:
      "Best for teams launching a new mobile product, extending an existing platform, or improving an app that feels harder to use than it should.",
    Icon: Smartphone,
  },
  {
    id: "cloud-solutions",
    eyebrow: "Cloud systems",
    title: "Cloud Solutions",
    desc: "Infrastructure, hosting, and deployment foundations that support dependable growth.",
    detail:
      "We help you move to the cloud or improve what is already there with infrastructure choices that support uptime, security, and predictable releases.",
    highlights: [
      "Cloud architecture planning for new systems, migrations, and modernization work.",
      "Deployment pipelines, hosting strategy, and environment management for calmer releases.",
      "Performance, security, and observability improvements that reduce operational risk.",
    ],
    bestFit:
      "A fit for businesses that need dependable infrastructure, smoother delivery, and a clearer path from prototype to production.",
    Icon: Cloud,
  },
  {
    id: "it-consulting",
    eyebrow: "Technical clarity",
    title: "IT Consulting",
    desc: "Practical guidance that connects technology decisions to business outcomes.",
    detail:
      "We work with your team to identify technical bottlenecks, reduce delivery friction, and make sure technology choices support the business instead of slowing it down.",
    highlights: [
      "Technology audits that surface process issues, architecture risks, and tooling gaps.",
      "Roadmaps for modernization, product delivery, and platform improvements.",
      "Practical guidance on team workflows, vendor decisions, and technical priorities.",
    ],
    bestFit:
      "Useful when you need a clearer technical direction, a second opinion on important decisions, or a plan to execute with less waste.",
    Icon: LifeBuoy,
  },
];

type Service = {
  id: string;
  eyebrow: string;
  title: string;
  desc: string;
  detail: string;
  highlights: string[];
  bestFit: string;
  Icon: LucideIcon;
};

export default function Services() {
  const prefersReducedMotion = useReducedMotion();
  const transition = {
    duration: 0.7,
    ease: smoothEase,
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
    <section
      id="services"
      className="relative overflow-hidden border-y border-neutral-200 bg-white py-24 text-neutral-950 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-100 sm:py-28"
    >
      <div className="container mx-auto max-w-7xl px-6">
        <motion.div
          {...motionProps}
          className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(22rem,0.42fr)] lg:items-end"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
              What we build
            </p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-neutral-950 dark:text-white sm:text-5xl">
              Digital products shaped around the way your business actually works.
            </h2>
          </div>

          <p className="max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-300 sm:text-lg">
            Good Code brings strategy, design, development, hosting, and support into one deliberate process, so ideas become dependable products instead of scattered tasks.
          </p>
        </motion.div>

        <motion.div
          {...motionProps}
          transition={prefersReducedMotion ? undefined : { ...transition, delay: 0.08 }}
          className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {services.map(({ id, eyebrow, title, desc, Icon }) => (
            <Link
              key={id}
              href={`#${id}`}
              className="group flex min-h-64 flex-col justify-between rounded-lg border border-neutral-200 bg-white p-5 shadow-sm shadow-neutral-950/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-[#67AFA7]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7] focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 dark:hover:border-[#67AFA7]/40 dark:hover:bg-white/[0.06] dark:focus-visible:ring-offset-neutral-950"
            >
              <span className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                  {eyebrow}
                </span>
                <Icon className="h-5 w-5 text-neutral-500 transition group-hover:scale-105 group-hover:text-[#2f6f69] dark:text-neutral-400 dark:group-hover:text-[#9ed9d2]" aria-hidden />
              </span>

              <span>
                <span className="block text-2xl font-semibold text-neutral-950 dark:text-white">
                  {title}
                </span>
                <span className="mt-4 block text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {desc}
                </span>
              </span>

              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#2f6f69] dark:text-[#9ed9d2]">
                Explore capability
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </motion.div>

        <div className="mt-20 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-white/10 dark:border-white/10">
          {services.map(({ id, title, detail, highlights, bestFit, Icon }, index) => (
            <motion.article
              key={id}
              id={id}
              {...motionProps}
              className="grid scroll-mt-28 gap-8 py-10 md:grid-cols-[12rem_minmax(0,1fr)] lg:grid-cols-[13rem_minmax(0,1fr)_20rem] lg:gap-10 lg:py-12"
            >
              <div className="flex items-start justify-between gap-4 md:block">
                <span className="font-mono text-sm text-neutral-400 dark:text-neutral-500">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300 md:mt-8">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-semibold text-neutral-950 dark:text-white">
                  {title}
                </h3>
                <p className="mt-5 max-w-3xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
                  {detail}
                </p>
                <ul className="mt-7 grid gap-3 sm:grid-cols-3">
                  {highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="border-l border-[#67AFA7]/50 pl-4 text-sm leading-6 text-neutral-700 dark:text-neutral-200"
                    >
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="rounded-lg border border-neutral-200 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f6f69] dark:text-[#9ed9d2]">
                  Best fit
                </p>
                <p className="mt-4 text-sm leading-7 text-neutral-700 dark:text-neutral-300">
                  {bestFit}
                </p>
              </aside>
            </motion.article>
          ))}
        </div>

        <motion.div
          {...motionProps}
          className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-neutral-200 pt-8 dark:border-white/10 md:flex-row md:items-center"
        >
          <p className="max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
            Need the right blend of product thinking, engineering discipline, and launch support?
          </p>
          <Button
            asChild
            size="lg"
            className="bg-[#67AFA7] text-white hover:bg-[#559e97] focus-visible:ring-[#67AFA7]"
          >
            <Link href="/contact-us">
              Start a project
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
