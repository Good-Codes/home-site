"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { SavedEstimateListItem } from "@/lib/account/estimate-types";
import { BrandButton } from "@/components/project-blueprint/ui";

export function SavedEstimatesList({
  estimates,
}: {
  estimates: SavedEstimateListItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (estimates.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          You have not saved a planning estimate yet. After you calculate one,
          use Save to my profile. You can keep up to five.
        </p>
        <BrandButton href="/custom-software-estimator">
          Open the estimator
        </BrandButton>
      </div>
    );
  }

  const remove = async (id: string) => {
    if (
      !window.confirm(
        "Remove this estimate from your profile? Good Code will still keep a copy for review.",
      )
    ) {
      return;
    }
    setError("");
    setPendingId(id);
    try {
      const response = await fetch(`/api/account/estimates/${id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Unable to remove this estimate.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove this estimate.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        {estimates.length} of 5 saved. Delete one if you need room for another.
      </p>
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="space-y-3">
        {estimates.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-neutral-200 p-4 dark:border-white/10"
          >
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {item.productSummary}
            </p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {item.rangeLabel ?? "Range unavailable"} · Saved{" "}
              {new Date(item.savedToProfileAt).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/account/estimates/${item.id}`}
                className="inline-flex h-9 items-center rounded-md bg-[#67AFA7] px-3 text-sm font-medium text-white hover:bg-[#559e97]"
              >
                View
              </Link>
              <button
                type="button"
                disabled={pendingId === item.id}
                onClick={() => void remove(item.id)}
                className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-white/[0.06]"
              >
                {pendingId === item.id ? "Removing…" : "Delete"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
