// components/footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";
import { useTheme } from "next-themes";

const linkClass =
  "text-sm text-neutral-600 transition-colors duration-300 hover:text-[#67AFA7] dark:text-neutral-300 dark:hover:text-[#67AFA7]";

const headingClass =
  "mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/our-projects", label: "Our Projects" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/about-us", label: "About Us" },
];

export default function Footer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted
    ? resolvedTheme === "dark" ? "/dark_mode_logo.png" : "/light_mode_logo.png"
    : "/light_mode_logo.png";

  return (
    <footer className="bg-neutral-100 py-6 dark:bg-neutral-900">
      <div className="container mx-auto max-w-7xl px-4">
        {/* ── Mobile layout (< md): compact horizontal strip ── */}
        <div className="flex flex-col items-center gap-4 md:hidden">
          {/* Logo + copyright */}
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
              <Image src={logoSrc} alt="Good Code" fill className="object-cover" />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              &copy; {new Date().getFullYear()} Good Code
            </p>
          </div>

          {/* Nav links — horizontal wrap */}
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Contact row */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
            <a href="tel:+27123456789" className={linkClass}>
              <Phone className="mr-1 inline h-3.5 w-3.5" />+27 12 345 6789
            </a>
            <a href="mailto:info@goodcode.com" className={linkClass}>
              <Mail className="mr-1 inline h-3.5 w-3.5" />info@goodcode.com
            </a>
          </div>

          {/* Address — single line */}
          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
            <MapPin className="mr-1 inline h-3.5 w-3.5" />
            123 Code Street, Polokwane City, PLK 10101, South Africa
          </p>
        </div>

        {/* ── Desktop layout (md+): 4-column grid ── */}
        <div className="hidden md:grid md:grid-cols-4 md:gap-6">
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
            <p className="mt-3 text-center text-sm text-neutral-500 dark:text-neutral-400">
              &copy; {new Date().getFullYear()} Good Code. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h3 className={headingClass}>Company</h3>
            <ul className="space-y-2">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Address */}
          <div className="text-center">
            <h3 className={headingClass}>Visit Us</h3>
            <address className="not-italic text-sm text-neutral-600 dark:text-neutral-300">
              <MapPin className="mx-auto mb-2 inline-block h-5 w-5" />
              <p>123 Code Street</p>
              <p>Polokwane City, PLK 10101</p>
              <p>South Africa</p>
            </address>
          </div>

          {/* Contact */}
          <div className="text-center">
            <h3 className={headingClass}>Contact</h3>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-300">
              <li className="flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+27123456789" className={linkClass}>
                  +27 12 345 6789
                </a>
              </li>
              <li className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@goodcode.com" className={linkClass}>
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