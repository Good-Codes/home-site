import { Flag } from "lucide-react";

import { cn } from "@/lib/utils";

export function DeletedAccountNotice({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800 dark:bg-red-500/20 dark:text-red-100",
          className,
        )}
        title="The person who created this estimate has deleted their account."
      >
        <Flag className="size-3" aria-hidden />
        Account deleted
      </span>
    );
  }

  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100",
        className,
      )}
      role="status"
    >
      <Flag className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        The person who created this estimate has deleted their account.
      </span>
    </p>
  );
}
