"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin/project-blueprint", label: "Inbox", match: "exact" as const },
  { href: "/admin/users", label: "Users", match: "prefix" as const },
  { href: "/admin/account", label: "Account", match: "prefix" as const },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const isLogin = pathname.startsWith("/admin/login");

  if (isLogin) {
    return <>{children}</>;
  }

  const signOutAdmin = async () => {
    setSigningOut(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-[#f4f8f7] text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="border-b border-neutral-200/80 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
        <div className="container mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
              Project Blueprint
            </p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Admin quotation workflow
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Admin">
            {NAV.map((item) => {
              const active =
                item.match === "exact"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-[#67AFA7]/15 text-[#1f4f4a] dark:bg-[#67AFA7]/20 dark:text-[#c5ebe5]"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-neutral-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => void signOutAdmin()}
              disabled={signingOut}
              className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-60 dark:text-neutral-400 dark:hover:bg-white/[0.06]"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </nav>
        </div>
      </div>
      <div className="container mx-auto max-w-7xl px-6 py-8 sm:py-10">{children}</div>
    </div>
  );
}
