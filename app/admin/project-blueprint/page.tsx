"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { AdminEstimateListItem } from "@/lib/project-blueprint/admin/demo-data";

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
  return status.replace(/_/g, " ");
}

export default function AdminEstimateInboxPage() {
  const [estimates, setEstimates] = useState<AdminEstimateListItem[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/project-blueprint/estimates");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Unable to load inbox.",
          );
        }
        if (cancelled) return;
        setEstimates(Array.isArray(data.estimates) ? data.estimates : []);
        setWarning(typeof data.warning === "string" ? data.warning : null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load inbox.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Estimate inbox
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          Review planning estimates, open risk flags, and start a human quotation
          when the client is ready.
        </p>
      </header>

      {warning ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
          role="status"
        >
          {warning}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading estimates…</p>
      ) : error ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : estimates.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          No estimates yet. New calculated results will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-[#f0f7f6] text-xs uppercase tracking-wide text-neutral-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Range</th>
                <th className="px-4 py-3 font-semibold">Confidence</th>
                <th className="px-4 py-3 font-semibold">Next step</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutral-100 last:border-0 dark:border-white/5"
                >
                  <td className="px-4 py-3 capitalize text-neutral-800 dark:text-neutral-200">
                    <Link
                      href={`/admin/project-blueprint/${row.id}`}
                      className="font-medium text-[#1f4f4a] underline-offset-4 hover:underline dark:text-[#9ed9d2]"
                    >
                      {statusLabel(row.status)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.clientName ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{row.rangeDisplay}</td>
                  <td className="px-4 py-3 capitalize">{row.confidence}</td>
                  <td className="max-w-[16rem] px-4 py-3 text-neutral-600 dark:text-neutral-300">
                    {row.nextStep}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                    {formatDate(row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
