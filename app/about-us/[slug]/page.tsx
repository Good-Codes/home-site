// app/about/[slug]/page.tsx
// Dynamic route — renders one team member's full bio page.
// The [slug] folder name tells Next.js this is a dynamic segment.

import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { team } from "@/lib/team-data";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// This generates the page metadata dynamically per team member.
// It now includes a description and Open Graph tags so that sharing
// a member's page on social media shows their photo, name, and bio.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = team.find((m) => m.slug === slug);
  if (!member) return { title: "Not Found" };

  return {
    title: member.name,
    description: `${member.name} — ${member.role} at Good Code. ${member.bio.slice(0, 120)}`,
    openGraph: {
      title: `${member.name} – Good Code`,
      description: member.bio.slice(0, 160),
      images: [{ url: member.image, alt: `Photo of ${member.name}` }],
    },
  };
}

// Pre-build a page for every team member at build time (better performance).
export function generateStaticParams() {
  return team.map((m) => ({ slug: m.slug }));
}

// The actual page component.
export default async function BioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Look up the team member whose slug matches the URL.
  const member = team.find((m) => m.slug === slug);

  // If no match, show a 404 page.
  if (!member) notFound();

  return (
    <main className="min-h-screen bg-white py-24 dark:bg-neutral-950">
      <div className="container mx-auto max-w-3xl px-6">
        {/* Back link */}
        <Link href="/about-us" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
          &larr; Back to team
        </Link>

        {/* Photo */}
        <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800 sm:h-96">
          <Image
            src={member.image}
            alt={`Photo of ${member.name}`}
            fill
            className="object-cover"
          />
        </div>

        {/* Name & role */}
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
          {member.name}
        </h1>
        <p className="mt-2 text-lg text-neutral-500 dark:text-neutral-400">
          {member.role}
        </p>

        {/* Bio */}
        <p className="mt-6 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
          {member.bio}
        </p>

        {/* CTA */}
        <div className="mt-10">
          <Link href="#contact">
            <Button size="sm">Get in touch</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
