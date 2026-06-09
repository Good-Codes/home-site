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
    <section className="relative isolate overflow-hidden bg-white text-neutral-950">
      <div className="container mx-auto max-w-7xl px-6 pb-6 pt-8 sm:pt-10 lg:pt-12">
        <motion.div
          className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <div className="mb-5 flex items-center gap-3 text-sm font-medium text-[#2f6f69]">
              <span className="h-px w-10 bg-[#67AFA7]" aria-hidden />
              <span>Good tech built by good people</span>
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Built by people. Powered by good code.
            </h1>
          </div>

          <div className="lg:pb-1">
            <p className="text-base leading-7 text-neutral-700 sm:text-lg">
              We design and build digital tools that help businesses move clearly, effectively, and meaningfully online.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-[#67AFA7] text-white hover:bg-[#559e97] focus-visible:ring-[#67AFA7]"
              >
                <Link href="/contact-us">
                  Get a quote
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-50"
              >
                <Link href="#services">
                  Explore services
                  <Layers3 className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mt-8 sm:mt-10 lg:mt-12"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col gap-4 text-sm font-medium text-neutral-700 sm:flex-row sm:items-center sm:justify-between">
            <p>Strategy, design, development, hosting, and ongoing support, all under one roof.</p>
            <ul
              className="flex flex-wrap gap-x-6 gap-y-2 font-semibold uppercase text-neutral-950"
              aria-label="Good Code capabilities"
            >
              {["Strategy", "Design", "Development", "Support"].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>

      <motion.figure
        className="relative mx-auto w-full max-w-[1916px] px-0 sm:px-6"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative overflow-hidden bg-white sm:rounded-t-lg sm:border-x sm:border-t sm:border-neutral-900/10 sm:shadow-2xl sm:shadow-neutral-950/10">
          <Image
            src="/team_potrait.png"
            alt="Conceptual artwork of the Good Code team formed from thousands of tiny people, symbolising collaboration and human connection."
            width={1916}
            height={821}
            priority
            sizes="(min-width: 1916px) 1916px, 100vw"
            className="h-auto w-full"
          />
        </div>
        <figcaption className="sr-only">
          A wide conceptual portrait showing the full Good Code team as crowd-formed figures.
        </figcaption>
      </motion.figure>
    </section>
  );
}
