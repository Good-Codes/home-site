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
          <Image
            src={theme === "dark" ? "/dark_mode_logo.png" : "/light_mode_logo.png"}
            alt="GoodCode Logo"
            width={50}
            height={50}
            sizes="(min-width: 768px) 50px, 50px"
            className="h-full w-full object-contain"
            priority
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden gap-6 md:flex">
          <NavLink href="#services">Services</NavLink>
          <NavLink href="#contact">Contact</NavLink>
          <NavLink href="/about">About us</NavLink>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex md:items-center md:gap-1.5">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="size-8">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link href="#contact">
            <Button size="sm">Get a Quote</Button>
          </Link>
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col gap-6 p-6">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="size-8 self-end">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <NavLink href="/about">About us</NavLink>
            <NavLink href="#services">Services</NavLink>
            <NavLink href="#contact">Contact</NavLink>
            <Link href="#contact">
              <Button size="sm" className="w-full">
                Get a Quote
              </Button>
            </Link>
          </SheetContent>
        </Sheet>
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
        hover:[text-shadow:0_0_20px_#67AFA7] dark:hover:[text-shadow:0_0_20px_#67AFA7]
      "
    >
      {children}
    </Link>
  );
}
