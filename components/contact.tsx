// contact.tsx
"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

/**
 * Contact section – starts the quoting process with a clean, minimal form.
 */
export default function Contact() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: integrate form submission (e.g., serverless function or email)
  };

  return (
    <section id="contact" className="bg-neutral-50 dark:bg-neutral-900 py-24">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
          Get in Touch
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-600 dark:text-neutral-300">
          Tell us about your project, and we’ll get back to you with a quote.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 grid max-w-2xl gap-6 md:grid-cols-2"
        >
          <div className="flex flex-col text-left">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" required className="mt-1" />
          </div>

          <div className="flex flex-col text-left">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="mt-1" />
          </div>

          <div className="flex flex-col text-left">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" className="mt-1" />
          </div>

          <div className="flex flex-col text-left md:col-span-2">
            <Label htmlFor="details">Project Details</Label>
            <Textarea
              id="details"
              name="details"
              rows={4}
              required
              className="mt-1"
            />
          </div>

          <div className="md:col-span-2">
            <Button size="lg" type="submit" className="w-full">
              Submit
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
