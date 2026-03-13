// components/contact.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    details: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } }
  };
  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
      setFormData({ name: "", email: "", phone: "", details: "" }); // reset form
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Failed to send message. Please try again.");
    }
  };

  return (
    <motion.section
      id="contact"
      className="bg-neutral-50 dark:bg-neutral-900 py-24"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
          Get in Touch
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-600 dark:text-neutral-300">
          Tell us about your project, and we’ll get back to you with a quote.
        </p>

        <motion.form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 grid max-w-2xl gap-6 md:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={fieldVariants} className="flex flex-col text-left">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1"
              disabled={status === "loading"}
            />
          </motion.div>

          <motion.div variants={fieldVariants} className="flex flex-col text-left">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1"
              disabled={status === "loading"}
            />
          </motion.div>

          <motion.div variants={fieldVariants} className="flex flex-col text-left">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1"
              disabled={status === "loading"}
            />
          </motion.div>

          <motion.div variants={fieldVariants} className="flex flex-col text-left md:col-span-2">
            <Label htmlFor="details">Project Details *</Label>
            <Textarea
              id="details"
              name="details"
              rows={4}
              required
              value={formData.details}
              onChange={handleChange}
              className="mt-1"
              disabled={status === "loading"}
            />
          </motion.div>

          <motion.div variants={fieldVariants} className="md:col-span-2">
            <Button
              size="lg"
              type="submit"
              className="w-full"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending..." : "Submit"}
            </Button>
          </motion.div>

          {/* Status messages */}
          {status === "success" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-2 text-center text-neutral-600 dark:text-neutral-300"
            >
              Thank you! We'll get back to you soon.
            </motion.p>
          )}
          {status === "error" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-2 text-center text-red-600 dark:text-red-400"
            >
              {errorMessage}
            </motion.p>
          )}
        </motion.form>

        {/* Extra link (optional) */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
        >
        </motion.div>
      </div>
    </motion.section>
  );
}