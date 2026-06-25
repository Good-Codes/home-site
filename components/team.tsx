// components/team.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { team } from "@/lib/team-data";
import { smoothEase } from "@/lib/motion";

// ── Animation variants ────────────────────────────────────────────
const headingVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: smoothEase } },
};

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: smoothEase },
  },
};

function truncateWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}...`;
}

// ── Component ─────────────────────────────────────────────────────
export default function Team() {
  return (
    <section
      id="team"
      className="bg-white py-24 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100 sm:py-28"
    >
      <div className="container mx-auto max-w-6xl px-6">
        {/* Section heading */}
        <motion.div
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
            The team
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-center text-4xl font-semibold leading-tight text-neutral-950 dark:text-white sm:text-5xl">
            The Team Behind Your Next Digital Milestone
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-7 text-neutral-600 dark:text-neutral-300">
            A small, senior-led team that cares deeply about craft, collaboration, and quality.
          </p>
        </motion.div>

        {/* Card grid */}
        <motion.div
          className="mt-16 flex flex-wrap justify-center gap-4 sm:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {team.map(({ slug, name, role, bio, image }) => (
            <motion.div key={slug} variants={cardVariants} className="w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.34rem)]">
              <div className="group block h-full">
                <Card
                  className="
                    flex h-full flex-col overflow-hidden border-neutral-200 bg-white shadow-sm shadow-neutral-950/[0.03] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20
                    transform transition duration-300 ease-in-out
                    hover:-translate-y-0.5 hover:scale-100 hover:border-[#67AFA7]/50
                  "
                >
                {/* Photo */}
                <div className="relative h-28 w-full bg-neutral-100 dark:bg-white/[0.06] sm:h-56">
                  <Image
                    src={image}
                    alt={`Photo of ${name}`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Name & role */}
                <CardHeader className="p-3 sm:p-6 gap-0.5 sm:gap-1.5">
                  <CardTitle className="text-xs sm:text-base leading-tight">{name}</CardTitle>
                  <CardDescription className="text-[11px] sm:text-sm">{role}</CardDescription>
                </CardHeader>

                {/* Bio */}
                <CardContent className="flex flex-1 flex-col justify-between px-3 pb-3 pt-0 sm:px-6 sm:pb-6 sm:pt-0">
                  <p className="hidden min-h-[4.5rem] text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 sm:block">
                    {truncateWords(bio, 18)}
                  </p>
                  <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300 sm:hidden">
                    {truncateWords(bio, 10)}
                  </p>
                  <div className="mt-2 sm:mt-4 opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
                    <Link href={`/about-us/${slug}`}>
                      <span
                        className="inline-flex items-center rounded-md border border-neutral-300 px-2 py-1 text-[10px] font-medium text-neutral-800 transition-colors hover:border-[#67AFA7]/50 hover:text-[#2f6f69] dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-[#67AFA7]/50 dark:hover:text-[#9ed9d2] sm:px-3 sm:py-1.5 sm:text-xs"
                      >
                        Read more
                      </span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
