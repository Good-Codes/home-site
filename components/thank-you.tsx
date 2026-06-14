"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export default function ThankYou() {
  const sectionVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
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
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
          Message sent
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-semibold leading-tight text-neutral-950 dark:text-white md:text-7xl">
          Thank you.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
          Your message has been sent. Our team will review it and get back to you shortly.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-[#67AFA7] text-white hover:bg-[#559e97]">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
