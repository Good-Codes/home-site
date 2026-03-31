// navbar.tsx
"use client";

import Image from "next/image";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from 'framer-motion';

/**
 * Primary site navigation bar.
 * clean, translucent, and minimal.
 */
export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const headerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
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

        {/* Mobile menu */}
        <div className="flex items-center gap-1 md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="size-8">
            {mounted && (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col p-0 gap-0">
              {/* Header area with logo */}
              <div className="flex items-center gap-3 border-b border-neutral-200 px-6 pt-6 pb-5 dark:border-neutral-800">
                {mounted && (
                  <Image
                    src={theme === "dark" ? "/dark_mode_logo.png" : "/light_mode_logo.png"}
                    alt="GoodCode Logo"
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                )}
                <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Good Code
                </span>
              </div>

              {/* Navigation links */}
              <nav className="flex flex-1 flex-col gap-1 px-4 py-4">
                <MobileNavLink href="/">Home</MobileNavLink>
                <MobileNavLink href="/services">Services</MobileNavLink>
                <MobileNavLink href="/about-us">About Us</MobileNavLink>
                <MobileNavLink href="/our-projects">Our Projects</MobileNavLink>
                <MobileNavLink href="/contact-us">Contact Us</MobileNavLink>
              </nav>

              {/* Footer area */}
              <div className="border-t border-neutral-200 px-4 py-4 dark:border-neutral-800">
                <Link href="/contact-us">
                  <Button size="sm" className="w-full">
                    Get a Quote
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
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

/**
 * Mobile navigation link — larger tap target, hover/active styling.
 */
function MobileNavLink({
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
        rounded-lg px-3 py-2.5 text-[15px] font-medium
        text-neutral-700 dark:text-neutral-200
        transition duration-200 ease-in-out
        hover:bg-neutral-100 hover:text-[#67AFA7]
        dark:hover:bg-neutral-800 dark:hover:text-[#67AFA7]
        active:scale-[0.98]
      "
    >
      {children}
    </Link>
  );
}
