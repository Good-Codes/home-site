import React from "react";
import type { Metadata } from "next";
import Services from "@/components/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Web development, mobile apps, cloud infrastructure, and IT consulting — explore the full range of services Good Code offers.",
};

export default function ServicesPage() {
    return (
        <main>
          <Services />
        </main>
    );
}
