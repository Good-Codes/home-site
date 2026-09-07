"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

function initialsFromUser(name?: string | null, email?: string | null): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
    }
    return trimmedName.slice(0, 1).toUpperCase();
  }
  const trimmedEmail = email?.trim();
  return trimmedEmail ? trimmedEmail.slice(0, 1).toUpperCase() : "?";
}

export function SessionNav({ compact = false }: { compact?: boolean }) {
  const { data, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (data?.user) {
    const displayName = data.user.name || data.user.email || "Account";
    const initials = initialsFromUser(data.user.name, data.user.email);

    return (
      <div
        className={
          compact
            ? "flex flex-col gap-2"
            : "flex items-center gap-2 border-l border-neutral-200 pl-3 dark:border-white/15"
        }
      >
        <Link
          href="/account"
          className={
            compact
              ? "flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 dark:border-white/15 dark:bg-white/[0.06]"
              : "flex max-w-[11rem] items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 py-1 pl-1 pr-3 dark:border-white/15 dark:bg-white/10"
          }
          title="Account"
          aria-label={`Account (${displayName})`}
        >
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#67AFA7] text-[11px] font-semibold tracking-wide text-white"
            aria-hidden
          >
            {initials}
          </span>
          <span
            className="min-w-0 truncate text-sm font-medium text-neutral-800 dark:text-neutral-100"
            title={displayName}
          >
            {displayName}
          </span>
        </Link>
        <Button
          type="button"
          variant={compact ? "outline" : "ghost"}
          size="sm"
          className={
            compact
              ? "w-full"
              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
          }
          onClick={() => void signOut({ callbackUrl: "/" })}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button asChild variant={compact ? "outline" : "ghost"} size="sm" className={compact ? "w-full" : undefined}>
      <Link href="/login">Sign in</Link>
    </Button>
  );
}
