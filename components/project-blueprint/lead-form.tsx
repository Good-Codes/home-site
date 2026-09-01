"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { smoothEase } from "@/lib/motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrandButton } from "./ui";

type LeadFormProps = {
  estimateId: string;
  onClose: () => void;
};

type LeadStatus = "idle" | "loading" | "success" | "error";

export function LeadForm({ estimateId, onClose }: LeadFormProps) {
  const prefersReducedMotion = useReducedMotion();
  const [status, setStatus] = useState<LeadStatus>("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    consent: false,
    preferredNextStep: "email" as
      | "email"
      | "call"
      | "workshop"
      | "upload_brief"
      | "none",
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.consent) {
      setError("Please confirm we may contact you about this estimate.");
      return;
    }
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/project-blueprint/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          notes: form.notes.trim() || undefined,
          preferredNextStep: form.preferredNextStep,
          consent: true,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "We could not save your details. Please try again.",
        );
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: smoothEase }}
      className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]"
      aria-labelledby="lead-form-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            id="lead-form-heading"
            className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
          >
            Get this estimate by email
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            Contact details are only requested after you have seen the planning
            range. Phone number is optional.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-neutral-500 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7]"
        >
          Close
        </button>
      </div>

      {status === "success" ? (
        <p className="mt-6 text-sm leading-6 text-neutral-700 dark:text-neutral-300" role="status">
          Thanks — we will send your planning estimate and follow up if you asked
          for a conversation. A specialist review is still required before any
          formal quotation.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="pb-lead-name">Name</Label>
            <Input
              id="pb-lead-name"
              name="name"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="focus-visible:ring-[#67AFA7]"
            />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="pb-lead-email">Email</Label>
            <Input
              id="pb-lead-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="focus-visible:ring-[#67AFA7]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pb-lead-phone">Phone (optional)</Label>
            <Input
              id="pb-lead-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="focus-visible:ring-[#67AFA7]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pb-lead-company">Organisation (optional)</Label>
            <Input
              id="pb-lead-company"
              name="company"
              autoComplete="organization"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              className="focus-visible:ring-[#67AFA7]"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pb-lead-next">Preferred next step</Label>
            <select
              id="pb-lead-next"
              name="preferredNextStep"
              value={form.preferredNextStep}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  preferredNextStep: e.target.value as typeof f.preferredNextStep,
                }))
              }
              className="flex h-9 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7] dark:border-neutral-700"
            >
              <option value="email">Email me this estimate</option>
              <option value="call">Prefer a call</option>
              <option value="workshop">Book a workshop</option>
              <option value="upload_brief">I will upload a brief</option>
              <option value="none">No follow-up yet</option>
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pb-lead-notes">Anything else we should know? (optional)</Label>
            <Textarea
              id="pb-lead-notes"
              name="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="focus-visible:ring-[#67AFA7]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-[#67AFA7] focus:ring-[#67AFA7]"
                checked={form.consent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, consent: e.target.checked }))
                }
              />
              <span>
                I agree that Good Code may store these details and contact me
                about this Project Blueprint estimate.
              </span>
            </label>
          </div>

          {error ? (
            <p className="sm:col-span-2 text-sm text-red-700 dark:text-red-300" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <BrandButton type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Sending…" : "Send my estimate"}
            </BrandButton>
            <BrandButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </BrandButton>
          </div>
        </form>
      )}
    </motion.section>
  );
}
