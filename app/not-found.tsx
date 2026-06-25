"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { motion, type Variants } from "framer-motion";

import { Button } from "@/components/ui/button";
import { smoothEase } from "@/lib/motion";

export default function NotFound() {
  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: smoothEase },
    },
  };

  return (
    <motion.section
      className="flex min-h-screen items-center border-b border-neutral-200 bg-white py-24 text-neutral-950 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-100"
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto max-w-4xl px-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </div>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
          404 - Page not found
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-semibold leading-tight text-neutral-950 dark:text-white md:text-7xl">
          Wrong turn.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
          The page you are looking for does not exist, or the URL may be incorrect.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-[#67AFA7] text-white hover:bg-[#559e97]">
            <Link href="/">Back to Home</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-white/[0.06]"
          >
            <Link href="/contact-us">Contact Us</Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
