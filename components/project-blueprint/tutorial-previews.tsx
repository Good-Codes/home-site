import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { EstimatorTutorialPreview } from "@/lib/project-blueprint/tutorial";


function BrowserChrome({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-neutral-200/80 bg-neutral-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <span className="size-1.5 rounded-full bg-[#ff5f57] sm:size-2" />
      <span className="size-1.5 rounded-full bg-[#febc2e] sm:size-2" />
      <span className="size-1.5 rounded-full bg-[#28c840] sm:size-2" />
      <span className="ml-2 min-w-0 truncate rounded-full bg-white px-2 py-0.5 text-[10px] text-neutral-400 dark:bg-white/10">
        {url}
      </span>
    </div>
  );
}

function PreviewShell({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-[12rem] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950 sm:min-h-[18rem] md:min-h-[20rem]">
      <BrowserChrome url={url} />
      <div className="relative flex-1 overflow-hidden p-4 sm:p-5">{children}</div>
    </div>
  );
}

function DescribePreview() {
  return (
    <PreviewShell url="goodcode.studio/estimate · describe">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f6f69] dark:text-[#9ed9d2]">
        Describe the idea
      </p>
      <p className="mt-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 sm:text-base">
        Tell us what you want to make possible
      </p>
      <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-[11px] leading-5 text-neutral-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300 sm:text-xs sm:leading-6">
        We need a customer portal where dealerships can upload finance
        applications, track progress, and collect monthly payments.
      </div>
      <div className="mt-3 inline-flex rounded-md bg-[#67AFA7] px-3 py-1.5 text-[11px] font-medium text-white">
        Review my idea
      </div>
    </PreviewShell>
  );
}

function ClarifyPreview() {
  return (
    <PreviewShell url="goodcode.studio/estimate · follow-ups">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f6f69] dark:text-[#9ed9d2]">
        A few details
      </p>
      <p className="mt-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 sm:text-base">
        Will people pay inside the product?
      </p>
      <div className="mt-3 space-y-2">
        <div className="flex items-start gap-2 rounded-md border border-[#67AFA7] bg-[#67AFA7]/15 p-2.5 ring-2 ring-[#67AFA7]/40">
          <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-[#67AFA7] text-[8px] text-white">
            ✓
          </span>
          <span className="text-[11px] font-semibold text-[#2f6f69] dark:text-[#9ed9d2] sm:text-xs">
            Yes — monthly collections
          </span>
        </div>
        <div className="flex items-start gap-2 rounded-md border border-neutral-200 p-2.5 dark:border-white/10">
          <span className="mt-0.5 size-3.5 shrink-0 rounded-full border-2 border-neutral-300 dark:border-white/30" />
          <span className="text-[11px] text-neutral-600 dark:text-neutral-300 sm:text-xs">
            I’m not sure yet
          </span>
        </div>
      </div>
    </PreviewShell>
  );
}

function ReviewPreview() {
  return (
    <PreviewShell url="goodcode.studio/estimate · review">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f6f69] dark:text-[#9ed9d2]">
        What we understood
      </p>
      <p className="mt-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 sm:text-base">
        A dealership finance portal
      </p>
      <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
        For dealership staff and the finance team
      </p>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {["Portal", "Uploads", "Payments"].map((label) => (
          <div
            key={label}
            className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2 text-center text-[10px] font-medium text-neutral-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="mt-3 inline-flex rounded-md bg-[#67AFA7] px-3 py-1.5 text-[11px] font-medium text-white">
        Build my estimate
      </div>
    </PreviewShell>
  );
}

function ResultsPreview() {
  return (
    <PreviewShell url="goodcode.studio/estimate · results">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f6f69] dark:text-[#9ed9d2]">
        Indicative planning estimate
      </p>
      <p className="mt-3 text-[11px] text-neutral-500 dark:text-neutral-400">
        Recommended investment range
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-2xl">
        R550k – R1.3m
      </p>
      <p className="mt-2 text-[11px] text-neutral-600 dark:text-neutral-300">
        Likely delivery window: 16–28 weeks
      </p>
      <p className="mt-2 text-[11px] font-medium text-[#2f6f69] dark:text-[#9ed9d2]">
        Moderate confidence
      </p>
    </PreviewShell>
  );
}

const PREVIEWS: Record<EstimatorTutorialPreview, () => ReactNode> = {
  describe: DescribePreview,
  clarify: ClarifyPreview,
  review: ReviewPreview,
  results: ResultsPreview,
};

export function TutorialStepPreview({
  kind,
  className,
}: {
  kind: EstimatorTutorialPreview;
  className?: string;
}) {
  const Preview = PREVIEWS[kind];
  return (
    <div className={cn("h-full", className)} aria-hidden>
      <Preview />
    </div>
  );
}
