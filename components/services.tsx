// services.tsx
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Code, Smartphone, Cloud, LifeBuoy } from "lucide-react";
import { motion } from 'framer-motion';

/**
 * Services section showcasing the main offerings of GoodCode.
 * clean grid, subtle depth, and concise copy.
 */
export default function Services() {
  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };
  return (
    <motion.section
      id="services"
      className="bg-white dark:bg-neutral-900 py-24"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
          Our Services
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-600 dark:text-neutral-300">
          From concept to deployment, our tailored solutions help your business thrive in a digital world.
        </p>

        <motion.div
          className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {services.map(({ title, desc, Icon }) => (
            <motion.div key={title} variants={itemVariants}>
              <Card
                className="
                  border-transparent bg-neutral-50 dark:bg-neutral-800/50 backdrop-blur-sm
                  transform transition duration-300 ease-in-out
                  hover:-translate-y-1 hover:scale-105
                  hover:shadow-lg hover:shadow-[#6A7A78] dark:hover:shadow-[#67AFA7]
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
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
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
