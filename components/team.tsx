// components/team.tsx
"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

/**
 * Team section – displays employee cards with photo, name, role, and bio.
 */

// ── Team member data ──────────────────────────────────────────────
// Each object represents one team member. To add a new person,
// just add another object to this array.
const team = [
  {
    name: "Katlego Thubisi",
    role: "Founder & Lead Engineer",
    bio: "Full‑stack architect with 12 years of experience turning ambitious ideas into production‑ready products.",
    image: "/team/katlego.jpg",
  },
  {
    name: "Masego Dipela",
    role: "Senior Designer",
    bio: "Design‑system thinker who obsesses over typography, spacing, and user delight in every interaction.",
    image: "/team/masego.jpg",
  },
  {
    name: "Pierre Van Zyl",
    role: "Frontend Developer",
    bio: "React and Next.js specialist focused on performance, accessibility, and pixel‑perfect interfaces.",
    image: "/team/pierre.jpg",
  },
  {
    name: "⁠Emmanuel Ayisi",
    role: "Backend Developer",
    bio: "API guru with a knack for scalable architectures, database optimization, and clean code.",
    image: "/team/emmanuel.jpg",
  },
  {
    name: "Benjamin Taylor",
    role: "Intern",
    bio: "Intern with a passion for learning and a fresh perspective on modern web development trends.",
    image: "/team/benjamin.jpg",
  },
  {
    name: "Kokie Molepo",
    role: "Intern",
    bio: "Intern who brings enthusiasm, creativity, and a willingness to dive into new challenges headfirst.",
    image: "/team/kokie.jpg",
  },
  {
    name: "Eric Russell",
    role: "Intern",
    bio: "Intern with a background in design, eager to bridge the gap between aesthetics and functionality in web products.",
    image: "/team/eric.jpg",
  },
] as const;

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
          className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {team.map(({ name, role, bio, image }) => (
            <motion.div key={name} variants={cardVariants} className="h-full">
              <Card className="h-full overflow-hidden bg-neutral-50 dark:bg-neutral-900">
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
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}