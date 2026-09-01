"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrandButton } from "@/components/project-blueprint/ui";

type LineItem = {
  kind: "work_package" | "custom" | "third_party" | "discount" | "other";
  label: string;
  description: string;
  quantity: number;
  unitAmountZar: number;
};

type Milestone = {
  label: string;
  percent: number;
  dueLabel: string;
};

const emptyLine = (): LineItem => ({
  kind: "custom",
  label: "",
  description: "",
  quantity: 1,
  unitAmountZar: 0,
});

export default function AdminQuoteBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const estimateId = params.id;

  const [scenario, setScenario] = useState<"lean" | "recommended" | "scale">(
    "recommended",
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      kind: "work_package",
      label: "Discovery & architecture",
      description: "Clarify journeys, integrations, and delivery plan.",
      quantity: 1,
      unitAmountZar: 48000,
    },
    {
      kind: "work_package",
      label: "Core build",
      description: "Primary product surfaces and foundations.",
      quantity: 1,
      unitAmountZar: 320000,
    },
  ]);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { label: "Kick-off & discovery", percent: 20, dueLabel: "On signature" },
    { label: "Build mid-point", percent: 40, dueLabel: "Sprint milestone" },
    { label: "Launch & handover", percent: 40, dueLabel: "Go-live" },
  ]);
  const [assumptionsText, setAssumptionsText] = useState(
    "Client provides content and business rules during discovery.\nThird-party licence fees are billed separately where applicable.",
  );
  const [exclusionsText, setExclusionsText] = useState(
    "Ongoing marketing campaigns\nHardware procurement\nPost-launch feature backlog beyond the agreed phase",
  );
  const [overrideReason, setOverrideReason] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const subtotal = useMemo(
    () =>
      lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unitAmountZar,
        0,
      ),
    [lineItems],
  );

  const submit = async (issue: boolean) => {
    setStatus("saving");
    setMessage("");

    const assumptions = assumptionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const exclusions = exclusionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/admin/project-blueprint/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId,
          scenario,
          lineItems: lineItems.map((item) => ({
            ...item,
            amountZar: item.quantity * item.unitAmountZar,
          })),
          milestones: milestones.map((m) => ({
            label: m.label,
            percent: m.percent,
            dueLabel: m.dueLabel,
            amountZar: Math.round((subtotal * m.percent) / 100),
          })),
          assumptions,
          exclusions,
          overrideReason: overrideReason.trim() || undefined,
          issue,
          subtotalZar: subtotal,
          taxZar: null,
          totalZar: subtotal,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Unable to save quotation.",
        );
      }
      setStatus("success");
      setMessage(
        data.warning
          ? String(data.warning)
          : issue
            ? "Quotation issued."
            : "Draft quotation saved.",
      );
      if (issue && !data.demo) {
        router.push(`/admin/project-blueprint/${estimateId}`);
      }
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Unable to save quotation.",
      );
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(false);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
          Quotation builder
        </p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Reviewed quotation
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          Select a scenario, adjust client-facing line items and milestones, then
          save a draft or issue. Internal sell rates are never shown here.
        </p>
      </header>

      <p
        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
        role="status"
      >
        PLACEHOLDER — line amounts below are starter figures for workflow
        testing. Calibrate before treating as commercial.
      </p>

      <form onSubmit={onSubmit} className="space-y-8">
        <section className="space-y-3">
          <Label htmlFor="scenario">Scenario</Label>
          <select
            id="scenario"
            value={scenario}
            onChange={(e) =>
              setScenario(e.target.value as "lean" | "recommended" | "scale")
            }
            className="flex h-10 w-full max-w-sm rounded-md border border-neutral-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67AFA7] dark:border-neutral-700 dark:bg-neutral-950"
          >
            <option value="lean">Lean</option>
            <option value="recommended">Recommended</option>
            <option value="scale">Scale-ready</option>
          </select>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Line items</h2>
            <button
              type="button"
              className="text-sm font-medium text-[#2f6f69] underline-offset-4 hover:underline dark:text-[#9ed9d2]"
              onClick={() => setLineItems((items) => [...items, emptyLine()])}
            >
              Add line
            </button>
          </div>
          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <div
                key={`line-${index}`}
                className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03] md:grid-cols-12"
              >
                <div className="md:col-span-3">
                  <Label>Kind</Label>
                  <select
                    value={item.kind}
                    onChange={(e) => {
                      const kind = e.target.value as LineItem["kind"];
                      setLineItems((rows) =>
                        rows.map((row, i) =>
                          i === index ? { ...row, kind } : row,
                        ),
                      );
                    }}
                    className="mt-1 flex h-9 w-full rounded-md border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  >
                    <option value="work_package">Work package</option>
                    <option value="custom">Custom</option>
                    <option value="third_party">Third party</option>
                    <option value="discount">Discount</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <Label>Label</Label>
                  <Input
                    className="mt-1"
                    value={item.label}
                    required
                    onChange={(e) =>
                      setLineItems((rows) =>
                        rows.map((row, i) =>
                          i === index ? { ...row, label: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Qty</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={item.quantity}
                    onChange={(e) =>
                      setLineItems((rows) =>
                        rows.map((row, i) =>
                          i === index
                            ? { ...row, quantity: Number(e.target.value) || 0 }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="md:col-span-3">
                  <Label>Amount (ZAR)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    step={1}
                    value={item.unitAmountZar}
                    onChange={(e) =>
                      setLineItems((rows) =>
                        rows.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                unitAmountZar: Number(e.target.value) || 0,
                              }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="md:col-span-12">
                  <Label>Description</Label>
                  <Input
                    className="mt-1"
                    value={item.description}
                    onChange={(e) =>
                      setLineItems((rows) =>
                        rows.map((row, i) =>
                          i === index
                            ? { ...row, description: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            Subtotal: R{Math.round(subtotal).toLocaleString("en-ZA")}
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Milestones</h2>
            <button
              type="button"
              className="text-sm font-medium text-[#2f6f69] underline-offset-4 hover:underline dark:text-[#9ed9d2]"
              onClick={() =>
                setMilestones((rows) => [
                  ...rows,
                  { label: "", percent: 0, dueLabel: "" },
                ])
              }
            >
              Add milestone
            </button>
          </div>
          {milestones.map((milestone, index) => (
            <div
              key={`ms-${index}`}
              className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03] md:grid-cols-3"
            >
              <div>
                <Label>Label</Label>
                <Input
                  className="mt-1"
                  value={milestone.label}
                  required
                  onChange={(e) =>
                    setMilestones((rows) =>
                      rows.map((row, i) =>
                        i === index ? { ...row, label: e.target.value } : row,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Label>Percent</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  max={100}
                  value={milestone.percent}
                  onChange={(e) =>
                    setMilestones((rows) =>
                      rows.map((row, i) =>
                        i === index
                          ? { ...row, percent: Number(e.target.value) || 0 }
                          : row,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Label>Due</Label>
                <Input
                  className="mt-1"
                  value={milestone.dueLabel}
                  onChange={(e) =>
                    setMilestones((rows) =>
                      rows.map((row, i) =>
                        i === index
                          ? { ...row, dueLabel: e.target.value }
                          : row,
                      ),
                    )
                  }
                />
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="assumptions">Assumptions (one per line)</Label>
            <Textarea
              id="assumptions"
              rows={5}
              value={assumptionsText}
              onChange={(e) => setAssumptionsText(e.target.value)}
              className="focus-visible:ring-[#67AFA7]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exclusions">Exclusions (one per line)</Label>
            <Textarea
              id="exclusions"
              rows={5}
              value={exclusionsText}
              onChange={(e) => setExclusionsText(e.target.value)}
              className="focus-visible:ring-[#67AFA7]"
            />
          </div>
        </section>

        <section className="space-y-2">
          <Label htmlFor="override-reason">Override reason</Label>
          <Textarea
            id="override-reason"
            rows={3}
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Required when adjusting commercial terms away from the planning estimate."
            className="focus-visible:ring-[#67AFA7]"
          />
        </section>

        {message ? (
          <p
            className={
              status === "error"
                ? "text-sm text-red-700 dark:text-red-300"
                : "text-sm text-neutral-700 dark:text-neutral-300"
            }
            role={status === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <BrandButton type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save draft"}
          </BrandButton>
          <BrandButton
            type="button"
            variant="outline"
            disabled={status === "saving"}
            onClick={() => void submit(true)}
          >
            Issue quotation
          </BrandButton>
          <BrandButton
            href={`/admin/project-blueprint/${estimateId}`}
            variant="outline"
          >
            Cancel
          </BrandButton>
        </div>
      </form>
    </div>
  );
}
