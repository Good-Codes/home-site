import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-7 text-neutral-600 dark:text-neutral-300">
          {description}
        </p>
      )}
    </div>
  );
}

export function BrandButton({
  href,
  children,
  className,
  variant = "solid",
  type,
  onClick,
  disabled,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "solid" | "outline";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const classes = cn(
    variant === "solid" &&
      "bg-[#67AFA7] text-white hover:bg-[#559e97] focus-visible:ring-[#67AFA7]/50",
    variant === "outline" &&
      "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-white/[0.06]",
    className,
  );

  if (href) {
    return (
      <Button
        asChild
        size="lg"
        variant={variant === "outline" ? "outline" : "default"}
        className={classes}
        disabled={disabled}
      >
        <Link href={href}>{children}</Link>
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      type={type ?? "button"}
      variant={variant === "outline" ? "outline" : "default"}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

export const optionCardClass =
  "rounded-lg border border-neutral-200 bg-white p-5 text-left shadow-sm shadow-neutral-950/[0.03] transition hover:-translate-y-0.5 hover:border-[#67AFA7]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20";

export const optionCardSelectedClass =
  "border-[#67AFA7]/70 ring-1 ring-[#67AFA7]/20";
