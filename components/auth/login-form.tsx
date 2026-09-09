"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

import {
  AuthMethodDivider,
  OAuthButtons,
} from "@/components/auth/oauth-buttons";
import { BrandButton } from "@/components/project-blueprint/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postAuthRedirect } from "@/lib/auth/callback-url";
import type { OAuthProviderId } from "@/lib/auth/oauth-providers";

export function LoginForm({
  nextPath,
  oauthProviders,
  oauthError,
}: {
  nextPath: string;
  oauthProviders: OAuthProviderId[];
  oauthError?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(oauthError ?? null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        const locked =
          result?.code === "account_locked" ||
          result?.error === "account_locked";
        setError(
          locked
            ? "This account is temporarily locked. Try again in a few minutes."
            : "Invalid email or password.",
        );
        return;
      }
      const sessionResponse = await fetch("/api/auth/session");
      const session = (await sessionResponse.json().catch(() => null)) as {
        user?: { role?: string };
      } | null;
      const destination = postAuthRedirect(nextPath || null, session?.user?.role);
      router.push(destination);
      router.refresh();
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <OAuthButtons providers={oauthProviders} nextPath={nextPath} />
      {oauthProviders.length > 0 ? <AuthMethodDivider /> : null}
      <form onSubmit={onSubmit} className="space-y-4">
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <BrandButton type="submit" disabled={submitting} className="w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </BrandButton>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          New here?{" "}
          <Link
            href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup"}
            className="font-medium text-[#2f6f69] underline-offset-2 hover:underline dark:text-[#9ed9d2]"
          >
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
