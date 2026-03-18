// hero.tsx
"use client";

import React from "react";
import Link from "next/link";
import TypewriterComponent from "typewriter-effect";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

import Image from "next/image";
import { useTheme } from "next-themes";
import MatrixBackground from "@/components/ui/matrix-background";

/**
 * Hero section with clear hierarchy and dynamic typewriter effect.
 */
export default function Hero() {
  const { theme } = useTheme();
  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };
  return (
    <motion.section
      className="relative isolate w-full overflow-hidden bg-background min-h-[55vh] flex items-center"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <MatrixBackground />
      {/* Blurred gradient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 flex justify-center"
      >
      </div>

      <div className="container mx-auto px-6 text-center">
        {/* Primary title */}
        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-7xl">
          Welcome to Good Code !
        </h1>

        {/* Secondary subtitle */}
        <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-3xl">
          Empowering your business with
        </h2>

        {/* Typewriter effect */}
        <div className="mx-auto mt-2 max-w-3xl text-xl font-bold text-neutral-900 dark:text-neutral-100 md:text-2xl">
          <TypewriterComponent
            options={{
              strings: [
                "Web Development.",
                "Mobile App Development.",
                "Cloud Solutions.",
                "IT Consulting."
              ],
              autoStart: true,
              loop: true,
              cursor: "|"
            }}
          />
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="#services">
            <Button variant="outline" size="lg">View Services</Button>
          </Link>
          <Link href="/contact-us">
            <Button size="lg">Get a Quote</Button>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
