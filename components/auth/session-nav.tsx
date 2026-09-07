"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function SessionNav({ compact = false }: { compact?: boolean }) {
  const { data, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (data?.user) {
    return (
      <div className={compact ? "flex flex-col gap-2" : "flex items-center gap-2"}>
        <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
          {data.user.name || data.user.email}
        </span>
        <Button
          type="button"
          variant={compact ? "outline" : "ghost"}
          size="sm"
          className={compact ? "w-full" : undefined}
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
