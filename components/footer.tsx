// components/footer.tsx
import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-neutral-100 py-12 dark:bg-neutral-900">
      <div className="container mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Address */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Visit Us
            </h3>
            <address className="not-italic text-neutral-600 dark:text-neutral-300">
              <MapPin className="mb-2 inline-block h-5 w-5" />
              <p>123 Code Street</p>
              <p>Polokwane City, PLK 10101</p>
              <p>South Africa</p>
            </address>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Contact
            </h3>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-300">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+27123456789" className="hover:text-[#6A7A78]">
                  +27 12 345 6789
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@goodcode.com" className="hover:text-[#6A7A78]">
                  info@goodcode.com
                </a>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-neutral-600 hover:text-blue-600 dark:text-neutral-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-neutral-600 hover:text-blue-600 dark:text-neutral-300">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-neutral-600 hover:text-blue-600 dark:text-neutral-300">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-neutral-200 pt-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <p>&copy; 2019 Good Code. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}