"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/project-blueprint", label: "Inbox", match: "exact" as const },
  { href: "/admin/users", label: "Users", match: "prefix" as const },
  { href: "/admin/account", label: "Account", match: "prefix" as const },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname.startsWith("/admin/login");

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[70vh] bg-[#f4f8f7] text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="border-b border-neutral-200/80 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
        <div className="container mx-auto flex items-center justify-between gap-4 px-3 py-2 md:px-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
              Project Blueprint
            </p>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
              Admin quotation workflow
            </p>
          </div>
          <nav
            className="ml-auto flex shrink-0 items-center justify-end gap-1"
            aria-label="Admin"
          >
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
          </nav>
        </div>
      </div>
      <div className="container mx-auto px-3 py-8 md:px-4 sm:py-10">{children}</div>
    </div>
  );
}
