// services.tsx
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Code, Smartphone, Cloud, LifeBuoy } from "lucide-react";

/**
 * Services section showcasing the main offerings of GoodCode.
 * clean grid, subtle depth, and concise copy.
 */
export default function Services() {
  return (
    <section id="services" className="bg-white dark:bg-neutral-900 py-24">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
          Our Services
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-600 dark:text-neutral-300">
          From concept to deployment, our tailored solutions help your business thrive in a digital world.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ title, desc, Icon }) => (
            <Card
              key={title}
              className="
                border-transparent bg-neutral-50 dark:bg-neutral-800/50 backdrop-blur-sm
                transform transition duration-300 ease-in-out
                hover:-translate-y-1 hover:scale-105
                hover:shadow-lg hover:shadow-blue-500/40 dark:hover:shadow-blue-300/30
              "
            >
              <CardContent className="flex flex-col items-center p-6">
                <Icon className="h-10 w-10 text-neutral-800 dark:text-neutral-100" />
                <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  {desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const services = [
  {
    title: "Web Development",
    desc: "Custom websites built with modern frameworks for performance and scalability.",
    Icon: Code,
  },
  {
    title: "Mobile App Development",
    desc: "iOS and Android apps crafted for engagement and reliability.",
    Icon: Smartphone,
  },
  {
    title: "Cloud Solutions",
    desc: "Secure and scalable cloud architectures tailored to your needs.",
    Icon: Cloud,
  },
  {
    title: "IT Consulting",
    desc: "Strategic guidance to align technology with your business goals.",
    Icon: LifeBuoy,
  },
] as const;
