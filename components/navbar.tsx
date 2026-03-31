// navbar.tsx
"use client";

import Image from "next/image";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, Sun, Moon, X } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Primary site navigation bar.
 * clean, translucent, and minimal.
 */
export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const headerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <>
      <motion.header
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="sticky top-0 z-50 w-full bg-background"
      >
        <nav className="container mx-auto flex items-center justify-between px-3 py-1.5 md:px-4 md:py-2">
          {/* Brand */}
          <Link href="/" className="flex h-9 w-9 shrink-0 items-center md:h-10 md:w-10">
            {mounted && (
              <Image
                src={theme === "dark" ? "/dark_mode_logo.png" : "/light_mode_logo.png"}
                alt="GoodCode Logo"
                width={50}
                height={50}
                sizes="(min-width: 768px) 50px, 50px"
                className="h-full w-full object-contain"
                priority
              />
            )}
          </Link>

          {/* Desktop links */}
          <div className="hidden gap-6 md:flex">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/services">Services</NavLink>
            <NavLink href="/about-us">About us</NavLink>
            <NavLink href="/our-projects">Our Projects</NavLink>
            <NavLink href="/contact-us">Contact us</NavLink>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex md:items-center md:gap-1.5">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="size-8">
              {mounted && (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
            </Button>
            <Link href="/contact-us">
              <Button size="sm">Get a Quote</Button>
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-1 md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="size-8">
              {mounted && (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setMenuOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </motion.header>

      {/* ── Floating glass mobile menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Blurred backdrop */}
            <motion.div
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Glass panel */}
            <motion.div
              className="
                fixed inset-x-4 top-4 z-[70] overflow-hidden rounded-2xl
                border border-white/20 shadow-2xl shadow-black/20
                bg-white/75 dark:bg-neutral-900/75
                backdrop-blur-2xl backdrop-saturate-150
              "
              initial={{ opacity: 0, scale: 0.92, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -20 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  {mounted && (
                    <Image
                      src={theme === "dark" ? "/dark_mode_logo.png" : "/light_mode_logo.png"}
                      alt="GoodCode Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  )}
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Good Code
                  </span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="
                    flex h-8 w-8 items-center justify-center rounded-full
                    bg-neutral-200/60 dark:bg-neutral-700/60
                    text-neutral-600 dark:text-neutral-300
                    transition hover:bg-neutral-300/80 dark:hover:bg-neutral-600/80
                  "
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="mx-5 h-px bg-neutral-300/50 dark:bg-neutral-600/50" />

              {/* Navigation links */}
              <nav className="flex flex-col gap-0.5 px-3 py-3">
                {[
                  { href: "/", label: "Home" },
                  { href: "/services", label: "Services" },
                  { href: "/about-us", label: "About Us" },
                  { href: "/our-projects", label: "Our Projects" },
                  { href: "/contact-us", label: "Contact Us" },
                ].map(({ href, label }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
                  >
                    <Link
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="
                        block rounded-xl px-3 py-2.5 text-[15px] font-medium
                        text-neutral-700 dark:text-neutral-200
                        transition duration-200
                        hover:bg-white/60 dark:hover:bg-white/10
                        hover:text-[#67AFA7] dark:hover:text-[#67AFA7]
                        active:scale-[0.98]
                      "
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Divider */}
              <div className="mx-5 h-px bg-neutral-300/50 dark:bg-neutral-600/50" />

              {/* CTA */}
              <div className="px-4 py-4">
                <Link href="/contact-us" onClick={() => setMenuOpen(false)}>
                  <Button size="sm" className="w-full rounded-xl">
                    Get a Quote
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Re‑usable navigation link with consistent styling.
 */
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        text-sm font-medium
        transition duration-300 ease-in-out
        hover:text-[#67AFA7] dark:hover:text-[#67AFA7]
        hover:[text-shadow:0_0_10px_#67AFA7] dark:hover:[text-shadow:0_0_10px_#67AFA7]
      "
    >
      {children}
    </Link>
  );
}
