// app/sitemap.ts
// ─────────────────────────────────────────────────────────────────────
// This file auto-generates /sitemap.xml at build time.
// A sitemap is an XML file that lists every public page on your site.
// You submit it to Google Search Console so Google's crawler discovers
// all your pages quickly instead of relying on link-following alone.
//
// Next.js calls the default export of this file and turns the returned
// array into valid XML — you never write XML by hand.
// ─────────────────────────────────────────────────────────────────────

import type { MetadataRoute } from "next";
import { team } from "@/lib/team-data";

// CHANGE THIS to your real production domain when you deploy.
const BASE_URL = "https://www.goodcode.co.za";

export default function sitemap(): MetadataRoute.Sitemap {
  // ── Static pages ────────────────────────────────────────────────
  // These are the fixed pages that always exist on the site.
  //
  //  • lastModified – tells Google when the content last changed.
  //  • changeFrequency – a hint about how often the page is updated.
  //  • priority (0.0–1.0) – how important this page is relative to
  //    others on your site. Home is usually 1.0.
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/our-projects`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about-us`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact-us`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.7,
    },
  ];

  // ── Dynamic pages ───────────────────────────────────────────────
  // One entry per team member's bio page so Google discovers them all.
  const teamPages: MetadataRoute.Sitemap = team.map((member) => ({
    url: `${BASE_URL}/about-us/${member.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...teamPages];
}
