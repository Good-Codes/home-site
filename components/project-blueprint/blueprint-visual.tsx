"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { smoothEase } from "@/lib/motion";
import type { ProjectBlueprintAnswers } from "@/lib/project-blueprint/types";

type BlueprintVisualProps = {
  answers: ProjectBlueprintAnswers;
  className?: string;
  compact?: boolean;
};

type NodeDef = {
  id: string;
  label: string;
  active: boolean;
  x: number;
  y: number;
};

function buildNodes(answers: ProjectBlueprintAnswers): NodeDef[] {
  const surfaces = answers.surfaces?.length ?? 0;
  const users = answers.userGroups?.length ?? 0;
  const caps = answers.capabilities?.length ?? 0;
  const integrations = (answers.integrations ?? []).filter(
    (id) => id !== "integration.none" && id !== "integration.unknown",
  ).length;
  const quality = answers.qualityRequirements?.length ?? 0;
  const hasPayments = (answers.capabilities ?? []).some((c) =>
    c.startsWith("cap.payments."),
  );
  const hasCloud =
    answers.route === "route.cloud_modernisation" ||
    (answers.surfaces ?? []).includes("surface.cloud_platform");

  return [
    { id: "surfaces", label: "Surfaces", active: surfaces > 0, x: 40, y: 36 },
    { id: "users", label: "Users", active: users > 0, x: 160, y: 28 },
    { id: "workflows", label: "Workflows", active: caps > 0, x: 280, y: 40 },
    {
      id: "integrations",
      label: "Integrations",
      active: integrations > 0,
      x: 80,
      y: 110,
    },
    {
      id: "data",
      label: "Data",
      active: (answers.capabilities ?? []).some((c) => c.startsWith("cap.data.")),
      x: 200,
      y: 118,
    },
    {
      id: "security",
      label: "Security",
      active: quality > 0 || hasPayments,
      x: 320,
      y: 108,
    },
    {
      id: "cloud",
      label: "Cloud",
      active: hasCloud || Boolean(answers.productLevel),
      x: 140,
      y: 178,
    },
    {
      id: "delivery",
      label: "Delivery",
      active: Boolean(answers.timing || answers.productLevel),
      x: 260,
      y: 178,
    },
  ];
}

const EDGES: Array<[string, string]> = [
  ["surfaces", "users"],
  ["users", "workflows"],
  ["surfaces", "integrations"],
  ["workflows", "data"],
  ["workflows", "security"],
  ["integrations", "cloud"],
  ["data", "cloud"],
  ["security", "delivery"],
  ["cloud", "delivery"],
];

export function BlueprintVisual({
  answers,
  className,
  compact = false,
}: BlueprintVisualProps) {
  const prefersReducedMotion = useReducedMotion();
  const nodes = useMemo(() => buildNodes(answers), [answers]);
  const byId = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes],
  );
  const activeCount = nodes.filter((n) => n.active).length;

  if (compact) {
    return (
      <ul
        className={cn(
          "grid grid-cols-2 gap-2 text-sm text-neutral-700 dark:text-neutral-300",
          className,
        )}
        aria-label="Blueprint summary groups"
      >
        {nodes.map((node) => (
          <li
            key={node.id}
            className={cn(
              "rounded-md border px-3 py-2",
              node.active
                ? "border-[#67AFA7]/50 bg-[#67AFA7]/10 text-neutral-900 dark:text-neutral-100"
                : "border-neutral-200 bg-white/60 text-neutral-400 dark:border-white/10 dark:bg-white/[0.03]",
            )}
          >
            {node.label}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 380 220"
        role="img"
        aria-label={`Project blueprint visual with ${activeCount} of ${nodes.length} groups filled in`}
        className="h-auto w-full text-neutral-300 dark:text-neutral-700"
      >
        <defs>
          <pattern
            id="pb-grid"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 16 0 L 0 0 0 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.35"
            />
          </pattern>
        </defs>
        <rect width="380" height="220" fill="url(#pb-grid)" opacity="0.5" />

        {EDGES.map(([from, to]) => {
          const a = byId[from];
          const b = byId[to];
          if (!a || !b) return null;
          const lit = a.active && b.active;
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x + 36}
              y1={a.y + 14}
              x2={b.x + 36}
              y2={b.y + 14}
              stroke={lit ? "#67AFA7" : "currentColor"}
              strokeWidth={lit ? 1.5 : 1}
              strokeOpacity={lit ? 0.7 : 0.35}
              strokeDasharray={lit ? undefined : "4 4"}
            />
          );
        })}

        {nodes.map((node) => (
          <motion.g
            key={node.id}
            initial={prefersReducedMotion ? false : { opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: smoothEase }}
          >
            <rect
              x={node.x}
              y={node.y}
              width="72"
              height="28"
              rx="6"
              fill={node.active ? "rgba(103,175,167,0.18)" : "rgba(255,255,255,0.55)"}
              stroke={node.active ? "#67AFA7" : "currentColor"}
              strokeWidth={node.active ? 1.5 : 1}
              className="dark:fill-white/[0.04]"
            />
            <text
              x={node.x + 36}
              y={node.y + 18}
              textAnchor="middle"
              className="fill-neutral-800 dark:fill-neutral-200"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {node.label}
            </text>
          </motion.g>
        ))}
      </svg>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        The blueprint fills in as you answer. It mirrors the text summary — it is
        not a technical architecture diagram.
      </p>
    </div>
  );
}
