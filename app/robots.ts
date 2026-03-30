// app/robots.ts
// ─────────────────────────────────────────────────────────────────────
// This file auto-generates /robots.txt at build time.
// robots.txt tells search-engine crawlers which pages they are allowed
// to visit and where the sitemap lives. Without it crawlers assume
// they can access everything (which is fine), but being explicit is
// good practice and lets you block pages you don't want indexed.
//
// Next.js calls the default export and produces valid robots.txt text.
// ─────────────────────────────────────────────────────────────────────

import type { MetadataRoute } from "next";

// CHANGE THIS to your real production domain when you deploy.
const BASE_URL = "https://www.goodcode.co.za";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all crawlers to access the whole site.
        userAgent: "*",
        allow: "/",
        // Block the thank-you confirmation page — no value in indexing it.
        disallow: ["/thank-you"],
      },
    ],
    // Point crawlers to the sitemap so they find every page.
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
