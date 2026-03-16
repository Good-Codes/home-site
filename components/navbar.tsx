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
      className="sticky top-0 z-50 w-full bg-background/70 backdrop-blur"
    >
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Brand */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="GoodCode Logo"
            width={120}
            height={40}
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden gap-6 md:flex">
          <NavLink href="/services">Services</NavLink>
          <NavLink href="/contact">Contact us</NavLink>
          <NavLink href="/about">About us</NavLink>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex md:items-center md:gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-2 w-2" /> : <Moon className="h-2 w-2" />}
          </Button>
          <Link href="#contact">
            <Button size="sm">Get a Quote</Button>
          </Link>
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col gap-6 p-6">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="self-end">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <NavLink href="/services">Services</NavLink>
            <NavLink href="/contact">Contact us</NavLink>
            <NavLink href="/about">About us</NavLink>
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
        hover:text-blue-600 dark:hover:text-blue-400
        hover:[text-shadow:0_0_8px_rgba(59,130,246,0.7)]
      "
    >
      {children}
    </Link>
  );
}
