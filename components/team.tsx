// components/team.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { team } from "@/lib/team-data";

// ── Animation variants ────────────────────────────────────────────
const headingVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
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
      className="bg-white py-24 dark:bg-neutral-950"
    >
      <div className="container mx-auto max-w-6xl px-6">
        {/* Section heading */}
        <motion.div
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-center text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
            The Team Behind Your Next Digital Milestone
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-neutral-600 dark:text-neutral-400">
            A small, senior‑led crew that cares deeply about craft, collaboration and quality.
          </p>
        </motion.div>

        {/* Card grid */}
        <motion.div
          className="mt-16 flex flex-wrap justify-center gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {team.map(({ slug, name, role, bio, image }) => (
            <motion.div key={slug} variants={cardVariants} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.34rem)]">
              <Link href={`/about-us/${slug}`} className="block h-full">
                <Card
                  className="
                    flex h-full min-h-[25rem] flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-900
                    transform transition duration-300 ease-in-out
                    hover:-translate-y-1 hover:scale-100
                    hover:shadow-lg hover:shadow-[#6A7A78] dark:hover:shadow-[#67AFA7]
                  "
                >
                {/* Photo */}
                <div className="relative h-56 w-full bg-neutral-200 dark:bg-neutral-800">
                  {/* <Image
                    src={image}
                    alt={`Photo of ${name}`}
                    fill
                    className="object-cover"
                  /> */}
                </div>

                {/* Name & role */}
                <CardHeader>
                  <CardTitle className="text-base">{name}</CardTitle>
                  <CardDescription>{role}</CardDescription>
                </CardHeader>

                {/* Bio */}
                <CardContent className="flex flex-1 flex-col justify-between pb-6">
                  <p className="min-h-[4.5rem] text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {truncateWords(bio, 18)}
                  </p>
                  <div className="mt-4 sm:hidden">
                    <span
                      className="inline-flex items-center rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
                    >
                      Read more
                    </span>
                  </div>
                </CardContent>
              </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}