// services.tsx
"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChevronUp, Cloud, Code, LifeBuoy, Smartphone, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import MatrixHoverOverlay, { type MatrixHoverOverlayHandle } from "@/components/ui/matrix-overlay";

/**
 * Services section showcasing the main offerings of GoodCode.
 * clean grid, subtle depth, and concise copy.
 */
export default function Services() {
  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
  };
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };
  const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();

    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    const offset = 112;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);

    window.history.replaceState(null, "", `#${targetId}`);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <motion.section
      id="services"
      className="bg-white dark:bg-neutral-900 py-24"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#67AFA7]/12 text-[#2f6f69] dark:bg-[#67AFA7]/10 dark:text-[#9ed9d2]">
            <Wrench className="h-7 w-7" aria-hidden />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
            Explore Our Services
          </h2>
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-600 dark:text-neutral-300">
          From concept to deployment, our tailored solutions help your business thrive in a digital world.
        </p>

        <motion.div
          className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {services.map(({ id, title, desc, Icon }) => (
            <motion.div key={id} variants={itemVariants} className="h-full">
              <a
                href={`#${id}`}
                aria-label={`Learn more about ${title}`}
                onClick={(event) => scrollToSection(event, id)}
                className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7] focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900"
              >
                <Card
                  className="
                    h-full border-transparent bg-neutral-50 dark:bg-neutral-800/50 backdrop-blur-sm
                    transform transition duration-400 ease-in-out
                    hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#67AFA7]
                    hover:border-[#67AFA7]/30 dark:hover:shadow-[#67AFA7]
                  "
                >
                  <CardContent className="flex h-full flex-col items-center p-6 text-center">
                    <Icon className="h-10 w-10 text-neutral-800 dark:text-neutral-100" />
                    <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                      {desc}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#67AFA7]">
                      Learn more
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-20 border-t border-neutral-200 pt-16 text-left dark:border-neutral-800"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="mt-12 space-y-6">
            {services.map(({ id, title, detail, highlights, outcomes, Icon }) => (
              <motion.article
                key={id}
                id={id}
                variants={itemVariants}
                className="scroll-mt-28 md:scroll-mt-32"
              >
                <Card className="border-neutral-200/80 bg-white/80 shadow-none backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/70">
                  <CardContent className="grid gap-8 p-6 md:grid-cols-[minmax(0,1fr)_16rem] md:gap-10 md:p-8">
                    <div>
                      <div className="flex flex-col gap-4 border-b border-neutral-200/80 pb-5 dark:border-neutral-800 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#67AFA7]/12 text-[#2f6f69] dark:bg-[#67AFA7]/10 dark:text-[#9ed9d2]">
                            <Icon className="h-6 w-6" />
                          </div>

                          <div>
                            <h4 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                              {title}
                            </h4>
                          </div>
                        </div>


                      </div>

                      <p className="mt-5 max-w-3xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
                        {detail}
                      </p>

                      <ul className="mt-6 space-y-3">
                        {highlights.map((highlight) => (
                          <li key={highlight} className="flex items-start gap-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#67AFA7]" aria-hidden />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col justify-between border-t border-neutral-200/80 pt-6 dark:border-neutral-800 md:border-t-0 md:border-l md:pl-8 md:pt-0">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#67AFA7]">
                          Best Fit
                        </p>
                        <p className="mt-4 text-sm leading-7 text-neutral-700 dark:text-neutral-200">
                          {outcomes}
                        </p>
                      </div>
                      <QuoteButton />
                      <button
                        onClick={() => {
                          const target = document.getElementById("services");
                          if (target) {
                            const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 112);
                            window.scrollTo({ top, behavior: "smooth" });
                          }
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition hover:text-[#67AFA7] dark:text-neutral-500 dark:hover:text-[#67AFA7]"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                        Back to top
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function QuoteButton() {
  const overlayRef = useRef<MatrixHoverOverlayHandle>(null);

  return (
    <Link
      href="/contact-us"
      className="relative mt-6 inline-flex items-center justify-center overflow-hidden rounded-lg bg-[#67AFA7] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#559e97]"
      onMouseEnter={() => overlayRef.current?.runOnce()}
    >
      <MatrixHoverOverlay ref={overlayRef} />
      <span className="relative z-30">Get a Quote</span>
    </Link>
  );
}

const services = [
  {
    id: "web-development",
    title: "Web Development",
    desc: "Custom websites built with modern frameworks for performance and scalability.",
    detail:
      "We build marketing sites, customer portals, and custom web applications that balance clean UX, strong performance, and room to grow with your business.",
    highlights: [
      "Responsive websites and web apps tailored to your brand and conversion goals.",
      "Fast frontends, accessible interfaces, and technical SEO baked into the build.",
      "CMS, analytics, payment, and third-party API integrations aligned with your workflow.",
    ],
    outcomes:
      "Ideal when you need a polished digital presence or a product-ready platform that can scale without constant rework.",
    Icon: Code,
  },
  {
    id: "mobile-app-development",
    title: "Mobile App Development",
    desc: "iOS and Android apps crafted for engagement and reliability.",
    detail:
      "We design and develop mobile experiences that feel native, perform reliably, and keep users engaged across iOS and Android devices.",
    highlights: [
      "Cross-platform or platform-specific app delivery based on your product requirements.",
      "User flows optimized for onboarding, retention, and everyday usability.",
      "Secure API connectivity, notifications, and offline-friendly behavior where needed.",
    ],
    outcomes:
      "Best for teams launching a new mobile product, extending an existing platform, or improving an app that is underperforming.",
    Icon: Smartphone,
  },
  {
    id: "cloud-solutions",
    title: "Cloud Solutions",
    desc: "Secure and scalable cloud architectures tailored to your needs.",
    detail:
      "We help you move to the cloud or improve what is already there with infrastructure choices that support uptime, security, and predictable growth.",
    highlights: [
      "Cloud architecture planning for new systems and migrations from legacy environments.",
      "Deployment pipelines, hosting strategy, and environment management for reliable delivery.",
      "Performance, security, and observability improvements that reduce operational risk.",
    ],
    outcomes:
      "A fit for businesses that need dependable infrastructure, smoother releases, and a clearer path to scale.",
    Icon: Cloud,
  },
  {
    id: "it-consulting",
    title: "IT Consulting",
    desc: "Strategic guidance to align technology with your business goals.",
    detail:
      "We work with your team to identify technical bottlenecks, reduce delivery friction, and make sure your technology choices support the business instead of slowing it down.",
    highlights: [
      "Technology audits that surface process issues, architecture risks, and tooling gaps.",
      "Roadmaps for modernization, product delivery, and platform improvements.",
      "Practical guidance on team workflows, vendor decisions, and technical priorities.",
    ],
    outcomes:
      "Useful when you need a clearer technical direction, a second opinion on important decisions, or a plan to execute with less waste.",
    Icon: LifeBuoy,
  },
] as const;

