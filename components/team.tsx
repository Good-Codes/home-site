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

// ── Component ─────────────────────────────────────────────────────
export default function Team() {
  return (
    <section className="bg-white py-24 dark:bg-neutral-950">
      <div className="container mx-auto max-w-6xl px-6">
        {/* Section heading */}
        <h2 className="text-center text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
          Meet the team
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-neutral-600 dark:text-neutral-400">
          A small, senior‑led crew that cares deeply about craft, collaboration and quality.
        </p>

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
              <Link href={`/about/${slug}`} className="block h-full">
                <Card
                  className="
                    h-full overflow-hidden bg-neutral-50 dark:bg-neutral-900
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
                <CardContent className="flex-1 pb-6">
                  <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {bio}
                  </p>
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