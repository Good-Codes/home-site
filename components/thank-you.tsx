"use client";

import React from "react";
import Link from "next/link";
import TypewriterComponent from "typewriter-effect";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import MatrixBackground from "@/components/ui/matrix-background";

export default function ThankYou() {
  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.section
      className="relative isolate w-full overflow-hidden bg-background min-h-[100vh] flex items-center"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <MatrixBackground />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 flex justify-center"
      />

      <div className="container mx-auto px-6 text-center">
        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-7xl">
          Thank You
        </h1>

        <div className="mx-auto mt-2 max-w-3xl text-xl font-bold text-neutral-900 dark:text-neutral-100 md:text-2xl">
          <TypewriterComponent
            options={{
              strings: [
                "Your message has been sent.",
                "Our team will contact you shortly.",
                "We look forward to creating some Good Code together!"
              ],
              autoStart: true,
              loop: true,
              cursor: "|"
            }}
          />
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/">
            <Button size="lg">Back to Home</Button>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
