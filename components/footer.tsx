// components/footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";
import { useTheme } from "next-themes";

export default function Footer() {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === "dark" ? "/dark_mode_logo.png" : "/light_mode_logo.png";

  return (
    <footer className="bg-neutral-100 py-4 dark:bg-neutral-900">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {/* Logo column */}
          <div className="flex flex-col items-center justify-start">
            <div className="relative h-20 w-20 overflow-hidden rounded-full">
              <Image
                src={logoSrc}
                alt="Good Code"
                fill
                className="object-cover"
                priority={false}
              />
            </div>
            {/* Copyright */}
            <p className="mt-3 text-center text-sm text-neutral-500 dark:text-neutral-400">
              &copy; {new Date().getFullYear()} Good Code. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/services"
                  className="text-neutral-600 transition-colors duration-300 hover:text-[#67AFA7] dark:text-neutral-300 dark:hover:text-[#6A7A78] text-sm"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/our-projects"
                  className="text-neutral-600 transition-colors duration-300 hover:text-[#67AFA7] dark:text-neutral-300 dark:hover:text-[#6A7A78] text-sm"
                >
                  Our Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="text-neutral-600 transition-colors duration-300 hover:text-[#67AFA7] dark:text-neutral-300 dark:hover:text-[#6A7A78] text-sm"
                >
                  Contact us
                </Link>
              </li>
              <li>
                <Link
                  href="/about-us"
                  className="text-neutral-600 transition-colors duration-300 hover:text-[#67AFA7] dark:text-neutral-300 dark:hover:text-[#67AFA7] text-sm"
                >
                  About us
                </Link>
              </li>
            </ul>
          </div>

          {/* Address */}
          <div className="text-center">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Visit Us
            </h3>
            <address className="not-italic text-neutral-600 dark:text-neutral-300 text-sm">
              <MapPin className="mx-auto mb-2 inline-block h-5 w-5" />
              <p>123 Code Street</p>
              <p>Polokwane City, PLK 10101</p>
              <p>South Africa</p>
            </address>
          </div>

          {/* Contact */}
          <div className="text-center">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Contact
            </h3>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-300">
              <li className="flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+27123456789" className="hover:text-[#67AFA7] dark:hover:text-[#67AFA7] text-sm">
                  +27 12 345 6789
                </a>
              </li>
              <li className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@goodcode.com" className="hover:text-[#67AFA7] dark:hover:text-[#67AFA7] text-sm">
                  info@goodcode.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}