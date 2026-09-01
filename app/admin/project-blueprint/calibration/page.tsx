"use client";

import { FormEvent, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrandButton } from "@/components/project-blueprint/ui";

const VARIANCE_REASONS = [
  "scope_change",
  "underestimated_integrations",
  "client_delay",
  "discovery_gap",
  "third_party_dependency",
  "quality_bar_raised",
  "other",
] as const;

type CalibrationForm = {
  estimateResultId: string;
  quotationId: string;
  actualEffortHours: string;
  actualDurationWeeks: string;
  varianceReasons: string[];
  recommendations: string;
};

type CalibrationRecord = {
  id: string;
  estimateResultId: string | null;
  quotationId: string | null;
  actualEffortHours: number | null;
  actualDurationWeeks: number | null;
  varianceReasons: string[];
  recommendations: string | null;
  createdAt: string;
};

export default function AdminCalibrationPage() {
  const [form, setForm] = useState<CalibrationForm>({
    estimateResultId: "",
    quotationId: "",
    actualEffortHours: "",
    actualDurationWeeks: "",
    varianceReasons: [],
    recommendations: "",
  });
  const [records, setRecords] = useState<CalibrationRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [demo, setDemo] = useState(false);

  const loadRecords = async () => {
    try {
      const res = await fetch("/api/admin/project-blueprint/calibration");
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(
          typeof data?.error === "string"
            ? data.error
            : "Unable to load calibration records.",
        );
        return;
      }
      setRecords(Array.isArray(data?.records) ? data.records : []);
      setDemo(Boolean(data?.demo));
      if (typeof data?.warning === "string") {
        setMessage(data.warning);
      }
    } catch {
      setMessage("Unable to load calibration records.");
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const toggleReason = (reason: string) => {
    setForm((current) => ({
      ...current,
      varianceReasons: current.varianceReasons.includes(reason)
        ? current.varianceReasons.filter((item) => item !== reason)
        : [...current.varianceReasons, reason],
    }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/project-blueprint/calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateResultId: form.estimateResultId || undefined,
          quotationId: form.quotationId || undefined,
          actualEffortHours: form.actualEffortHours
            ? Number(form.actualEffortHours)
            : undefined,
          actualDurationWeeks: form.actualDurationWeeks
            ? Number(form.actualDurationWeeks)
            : undefined,
          varianceReasons: form.varianceReasons,
          recommendations: form.recommendations || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(
          typeof data?.error === "string"
            ? data.error
            : "Unable to save calibration record.",
        );
        return;
      }

      setMessage(
        typeof data?.warning === "string"
          ? data.warning
          : "Calibration record saved.",
      );
      setForm({
        estimateResultId: "",
        quotationId: "",
        actualEffortHours: "",
        actualDurationWeeks: "",
        varianceReasons: [],
        recommendations: "",
      });

      if (data?.record) {
        setRecords((current) => [data.record as CalibrationRecord, ...current]);
        setDemo(Boolean(data.demo));
      } else {
        await loadRecords();
      }
    } catch {
      setMessage("Unable to save calibration record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Calibration
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          Compare original planning estimates to delivered outcomes. Findings
          inform future pricing drafts — they never auto-mutate published rules.
        </p>
      </header>

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white/70 px-5 py-10 text-center dark:border-white/15 dark:bg-white/[0.02]">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            No calibration records yet. After a delivery, capture actuals and
            variance reasons below.
            {demo ? " (Demo mode — records are not persisted.)" : null}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {records.map((record) => (
            <li
              key={record.id}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{record.id}</span>
                <time className="text-neutral-500" dateTime={record.createdAt}>
                  {new Date(record.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="mt-1 text-neutral-600 dark:text-neutral-300">
                Effort: {record.actualEffortHours ?? "—"} h · Duration:{" "}
                {record.actualDurationWeeks ?? "—"} w
                {record.varianceReasons.length
                  ? ` · ${record.varianceReasons.join(", ")}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
      >
        <h2 className="text-lg font-semibold">Record variance</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="estimate-result-id">Estimate result ID</Label>
            <Input
              id="estimate-result-id"
              value={form.estimateResultId}
              onChange={(e) =>
                setForm((f) => ({ ...f, estimateResultId: e.target.value }))
              }
              placeholder="uuid"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quotation-id">Quotation ID (optional)</Label>
            <Input
              id="quotation-id"
              value={form.quotationId}
              onChange={(e) =>
                setForm((f) => ({ ...f, quotationId: e.target.value }))
              }
              placeholder="uuid"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actual-hours">Actual effort (hours)</Label>
            <Input
              id="actual-hours"
              type="number"
              min={0}
              step={0.5}
              value={form.actualEffortHours}
              onChange={(e) =>
                setForm((f) => ({ ...f, actualEffortHours: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actual-weeks">Actual duration (weeks)</Label>
            <Input
              id="actual-weeks"
              type="number"
              min={0}
              step={0.5}
              value={form.actualDurationWeeks}
              onChange={(e) =>
                setForm((f) => ({ ...f, actualDurationWeeks: e.target.value }))
              }
            />
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Variance reasons</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {VARIANCE_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-[#67AFA7] focus:ring-[#67AFA7]"
                  checked={form.varianceReasons.includes(reason)}
                  onChange={() => toggleReason(reason)}
                />
                <span className="capitalize">{reason.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="recommendations">Recommendations</Label>
          <Textarea
            id="recommendations"
            rows={4}
            value={form.recommendations}
            onChange={(e) =>
              setForm((f) => ({ ...f, recommendations: e.target.value }))
            }
            placeholder="What should change in the next pricing draft?"
            className="focus-visible:ring-[#67AFA7]"
          />
        </div>

        {message ? (
          <p className="text-sm text-neutral-700 dark:text-neutral-300" role="status">
            {message}
          </p>
        ) : null}

        <BrandButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save calibration record"}
        </BrandButton>
      </form>
    </div>
  );
}
