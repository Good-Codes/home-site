"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";

/**
 * Homepage hero anchored by the Good Code team mosaic artwork.
 */
export default function Hero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#f7f8f5] text-neutral-950">
      <motion.figure
        className="pointer-events-none absolute inset-0 z-0"
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src="/team_potrait.png"
          alt="Conceptual artwork of the Good Code team formed from thousands of tiny people, symbolising collaboration and human connection."
          fill
          priority
          sizes="100vw"
          className="object-cover object-[56%_center] sm:object-center"
        />
        <figcaption className="sr-only">
          A wide conceptual portrait showing the Good Code team as crowd-formed figures.
        </figcaption>
      </motion.figure>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,#f7f8f5_0%,rgba(247,248,245,0.99)_27%,rgba(247,248,245,0.76)_45%,rgba(247,248,245,0.2)_68%,rgba(247,248,245,0)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-52 bg-gradient-to-t from-[#f7f8f5] via-[#f7f8f5]/70 to-transparent"
      />

      <div className="container relative z-20 mx-auto flex min-h-[680px] max-w-7xl flex-col justify-between px-6 py-10 sm:min-h-[720px] sm:py-14 lg:min-h-[calc(100svh-8rem)] lg:py-16">
        <motion.div
          className="max-w-3xl"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-5 flex items-center gap-3 text-sm font-medium text-[#2f6f69]">
            <span className="h-px w-10 bg-[#67AFA7]" aria-hidden />
            <span>Human-led digital solutions</span>
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Built by people. Powered by good code.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-700 sm:text-xl">
            We design and build websites, systems, and digital tools that help businesses move clearly, confidently,
            and beautifully online.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-[#67AFA7] text-white hover:bg-[#559e97] focus-visible:ring-[#67AFA7]">
              <Link href="/contact-us">
                Get a quote
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-neutral-300 bg-white/80 text-neutral-950 backdrop-blur hover:bg-white"
            >
              <Link href="#services">
                Explore services
                <Layers3 className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="mt-16 max-w-4xl border-t border-neutral-900/10 pt-5 sm:mt-20"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm font-medium leading-6 text-neutral-700">
            Strategy, design, development, hosting, and ongoing support, all under one roof.
          </p>
          <ul
            className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold uppercase text-neutral-950"
            aria-label="Good Code capabilities"
          >
            {["Strategy", "Design", "Development", "Support"].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
