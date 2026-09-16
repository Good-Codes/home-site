// components/contact.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
import { Phone } from "lucide-react";
import type { SavedEstimateListItem } from "@/lib/account/estimate-types";
import { CONTACT_NO_ESTIMATE } from "@/lib/email/constants";
import { smoothEase } from "@/lib/motion";
import { cn } from "@/lib/utils";

const packageLabels: Record<string, string> = {
  starter: "Starter",
  business: "Business",
  "business-plus": "Business Plus",
};

const selectClassName = cn(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
);

export default function Contact({
  savedEstimates = [],
}: {
  savedEstimates?: SavedEstimateListItem[];
}) {
  const useAccountForm = savedEstimates.length > 0;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    details: "",
  });
  const [estimateId, setEstimateId] = useState(
    useAccountForm ? savedEstimates[0]?.id ?? CONTACT_NO_ESTIMATE : CONTACT_NO_ESTIMATE,
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const describeNewProject = !useAccountForm || estimateId === CONTACT_NO_ESTIMATE;

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: smoothEase } },
  };
  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  };
  const fieldVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedPackage = params.get("package");
    const selectedService = params.get("service");
    const packageLabel = selectedPackage ? packageLabels[selectedPackage] : undefined;

    const details = packageLabel
      ? `I'm interested in the ${packageLabel} website package.`
      : selectedService === "website-pricing"
        ? "I'm interested in a Good Code website package."
        : "";

    if (details) {
      setFormData((current) =>
        current.details ? current : { ...current, details },
      );
      if (useAccountForm) {
        setEstimateId(CONTACT_NO_ESTIMATE);
      }
    }
  }, [useAccountForm]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const payload = useAccountForm
      ? {
          estimateId,
          details: describeNewProject ? formData.details : "",
        }
      : formData;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
      setFormData({ name: "", email: "", phone: "", details: "" });
      router.push("/thank-you");
    } catch (error: unknown) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again.",
      );
    }
  };

  return (
    <motion.section
      id="contact"
      className="bg-white py-24 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100 sm:py-28"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300">
            <Phone className="h-5 w-5" aria-hidden />
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
            Contact
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-neutral-950 dark:text-white sm:text-5xl">
            Get in Touch
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
            {useAccountForm
              ? "Choose a saved planning estimate, or describe a new project, and we'll get back to you with a practical next step."
              : "Tell us about your project, and we'll get back to you with a practical next step."}
          </p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="mx-auto mt-12 grid max-w-3xl gap-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm shadow-neutral-950/[0.03] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 md:grid-cols-2 md:p-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {useAccountForm ? (
            <motion.div variants={fieldVariants} className="flex flex-col text-left md:col-span-2">
              <Label htmlFor="estimateId">Saved estimate *</Label>
              <select
                id="estimateId"
                name="estimateId"
                required
                value={estimateId}
                onChange={(event) => setEstimateId(event.target.value)}
                className={cn(selectClassName, "mt-1")}
                disabled={status === "loading"}
              >
                <option value={CONTACT_NO_ESTIMATE}>
                  No estimate — I&apos;ll describe the project
                </option>
                {savedEstimates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.productSummary}
                    {item.rangeLabel ? ` · ${item.rangeLabel}` : ""}
                  </option>
                ))}
              </select>
            </motion.div>
          ) : (
            <>
              <motion.div variants={fieldVariants} className="flex flex-col text-left">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  maxLength={120}
                  autoComplete="name"
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
                  maxLength={254}
                  autoComplete="email"
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
                  maxLength={50}
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1"
                  disabled={status === "loading"}
                />
              </motion.div>
            </>
          )}

          <div
            className={cn(
              "flex flex-col text-left md:col-span-2",
              useAccountForm && !describeNewProject && "hidden",
            )}
          >
            <Label htmlFor="details">Project Details *</Label>
            <Textarea
              id="details"
              name="details"
              rows={6}
              required={describeNewProject}
              maxLength={5000}
              value={formData.details}
              onChange={handleChange}
              className="mt-1 min-h-32 resize-y field-sizing-fixed"
              disabled={status === "loading"}
            />
          </div>

          <motion.div variants={fieldVariants} className="md:col-span-2">
            <Button
              size="lg"
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-[#67AFA7] text-white hover:bg-[#559e97] focus-visible:ring-[#67AFA7]"
            >
              {status === "loading" ? "Sending…" : "Submit"}
            </Button>
          </motion.div>

          {status === "error" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-2 text-center text-red-600 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              {errorMessage}
            </motion.p>
          )}
        </motion.form>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
        />
      </div>
    </motion.section>
  );
}
