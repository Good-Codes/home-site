import React from "react";
import type { Metadata } from "next";
import Contact from "@/components/contact";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Good Code. Tell us about your project and receive a free quote for web, mobile, or cloud development.",
};

export default function ContactPage() {
    return (
        <main>
          <Contact />
        </main>
    );
}
