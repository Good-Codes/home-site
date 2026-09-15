"use client";

import Link from "next/link";
import { useState } from "react";

import { BrandButton } from "@/components/project-blueprint/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_RESET_SUCCESS_MESSAGE } from "@/lib/auth/constants";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (response.status === 429) {
        setError(data.error || "Too many reset requests. Please wait a few minutes.");
        return;
      }
      if (!response.ok && response.status !== 400) {
        setSubmitted(true);
        return;
      }
      if (!response.ok) {
        setError(data.error || "Enter a valid email address.");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-neutral-700 dark:text-neutral-300" role="status">
          {PASSWORD_RESET_SUCCESS_MESSAGE}
        </p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          <Link
            href="/login"
            className="font-medium text-[#2f6f69] underline-offset-2 hover:underline dark:text-[#9ed9d2]"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <BrandButton type="submit" disabled={submitting} className="w-full">
        {submitting ? "Sending…" : "Send reset link"}
      </BrandButton>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-[#2f6f69] underline-offset-2 hover:underline dark:text-[#9ed9d2]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
