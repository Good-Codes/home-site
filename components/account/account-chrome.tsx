import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AccountPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <header className="space-y-2">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        {title}
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
        {description}
      </p>
    </header>
  );
}

export function AccountCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-6 shadow-sm shadow-neutral-950/[0.03] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-black/20 md:p-8",
        className,
      )}
    >
      <h2 className="text-lg font-semibold tracking-tight md:text-xl">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function AccountFieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function ReadonlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium leading-none">{label}</p>
      <p className="flex min-h-9 items-center rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-100">
        {value || "—"}
      </p>
      {hint ? (
        <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
