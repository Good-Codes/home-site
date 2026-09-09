"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ProfileEstimateListItem } from "@/lib/account/types";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase();
}

export function SavedEstimatesList({
  estimates,
}: {
  estimates: ProfileEstimateListItem[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(estimates);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const onDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Remove this estimate from your profile? It will still be available to our team.",
    );
    if (!confirmed) return;

    setError(null);
    setBusyId(id);
    try {
      const response = await fetch(`/api/account/estimates/${id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Unable to remove that estimate.");
        return;
      }
      setRows((current) => current.filter((row) => row.id !== id));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        No saved estimates yet.{" "}
        <Link
          href="/custom-software-estimator"
          className="font-medium text-[#2f6f69] underline-offset-2 hover:underline dark:text-[#9ed9d2]"
        >
          Start an estimate
        </Link>{" "}
        and use Save to my profile on the results page.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {row.summary}
                </p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {formatDate(row.savedAt)} · {statusLabel(row.status)}
                  {row.rangeDisplay ? ` · ${row.rangeDisplay}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-[#1f4f4a] underline-offset-4 hover:underline disabled:opacity-60 dark:text-[#9ed9d2]"
                disabled={busyId === row.id}
                onClick={() => void onDelete(row.id)}
              >
                {busyId === row.id ? "Removing…" : "Delete"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
