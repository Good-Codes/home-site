"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandButton } from "@/components/project-blueprint/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => searchParams.get("next") || "/admin/project-blueprint",
    [searchParams],
  );

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    if (!configured) {
      // Demo path when Supabase is unset
      setStatus("idle");
      router.push(nextPath);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (mode === "magic") {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: `${origin}/admin/project-blueprint`,
          },
        });
        if (error) throw error;
        setStatus("sent");
        setMessage("Check your email for a magic link to continue.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Check your credentials and try again.",
      );
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
        Good Code Admin
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">
        Sign in
      </h1>
      <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
        Access the Project Blueprint inbox, pricing, and calibration tools.
      </p>

      {!configured ? (
        <p
          className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
          role="status"
        >
          PLACEHOLDER — Supabase is not configured. Continue enters demo admin
          mode with sample estimates.
        </p>
      ) : null}

      <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="username"
            required={configured}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-visible:ring-[#67AFA7]"
          />
        </div>

        {mode === "password" ? (
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required={configured}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-visible:ring-[#67AFA7]"
            />
          </div>
        ) : null}

        {message ? (
          <p
            className={
              status === "error"
                ? "text-sm text-red-700 dark:text-red-300"
                : "text-sm text-neutral-700 dark:text-neutral-300"
            }
            role={status === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <BrandButton type="submit" disabled={status === "loading"}>
            {status === "loading"
              ? "Working…"
              : !configured
                ? "Continue to demo admin"
                : mode === "magic"
                  ? "Send magic link"
                  : "Sign in"}
          </BrandButton>
          {configured ? (
            <button
              type="button"
              className="text-sm font-medium text-[#2f6f69] underline-offset-4 hover:underline dark:text-[#9ed9d2]"
              onClick={() => {
                setMode((m) => (m === "password" ? "magic" : "password"));
                setMessage("");
                setStatus("idle");
              }}
            >
              {mode === "password" ? "Use magic link instead" : "Use password instead"}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md py-20 text-sm text-neutral-500">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
