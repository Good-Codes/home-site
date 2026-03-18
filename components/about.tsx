// about.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";

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
      className="relative isolate overflow-hidden bg-neutral-50 py-24 dark:bg-neutral-950"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >

      <div className="container mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
          Crafting code that feels invisible
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
          We believe technology should fade into the background—making room for ideas
          and growth. Our senior‑led team ships polished web and mobile products where
          every line of code is written with intention.
        </p>
      </div>
    </motion.section>
  );
}

