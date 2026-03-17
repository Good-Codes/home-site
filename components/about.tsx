// about.tsx
"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

/**
 * About section – conveys Good Code's story, ethos, and differentiators.
 * Layout with generous whitespace, subtle depth, and animated highlights.
 */
export default function About() {
  // refined stagger & card animation variants
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } }
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.section
      id="about"
      className="relative isolate overflow-hidden bg-neutral-50 py-24 dark:bg-neutral-950"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Decorative background ring */}
      {/* <div className="pointer-events-none absolute inset-y-0 right-1/2 -z-10 w-[120%] translate-x-1/2 rotate-45 overflow-hidden blur-2xl">
        <div className="aspect-[4/3] w-full bg-gradient-to-tr from-neutral-200 via-white to-neutral-300 dark:from-neutral-800 dark:via-neutral-900 dark:to-black" />
      </div> */}

      <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 md:grid-cols-2 md:gap-20">
        {/* Copy */}
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
            Crafting code that feels invisible
          </h2>
          <p className="mt-6 text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
            At Good Code, we believe technology should disappear into the background—leaving
            room for ideas, experiences, and growth. Our small, senior‑led team has shipped
            dozens of web and mobile products for bold startups and established brands alike.
            Every pixel, every line of code, and every interaction is designed with care.
          </p>

          <motion.div
            className="mt-10 grid gap-6 sm:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {values.map(({ title, desc }) => (
              <motion.div
                key={title}
                style={{ perspective: 1000 }}
                className="relative w-full"
                variants={cardVariants}
                whileHover="hover"
              >
                {/* card with subtle depth */}
                <Card className="relative z-10 bg-white/80 backdrop-blur dark:bg-neutral-900/70">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {title}
                    </h3>
                    <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                      {desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Image / Illustration */}
        <div className="relative h-80 w-full md:h-auto">
          <Image
            src="/office-min.png"
            alt="Modern GoodCode workspace"
            fill
            priority
            className="rounded-3xl object-cover shadow-xl ring-1 ring-neutral-900/5 dark:ring-white/10"
          />
        </div>
      </div>
    </motion.section>
  );
}

const values = [
  {
    title: "Craftsmanship",
    desc: "Senior‑level talent shaping every detail throughout the code and design.",
  },
  {
    title: "Simplicity",
    desc: "Solutions engineered to be intuitive, maintainable, and performant.",
  },
  {
    title: "Partnership",
    desc: "Transparent collaboration focused on your goals and growth.",
  },
] as const;

