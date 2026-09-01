import type {
  EngineAnswers,
  PricingConfig,
  ThreePoint,
  TimelineRange,
  WorkPackage,
} from "./types";
import { pertExpectedFrom } from "./pert";

/**
 * Delivery timeline from dependency graph + parallel lanes + review/external factors.
 * Never: effort ÷ headcount. Never promise an impossible deadline.
 */

type LaneSchedule = {
  lane: string;
  weeks: number;
};

function hoursToWeeks(hours: number, hoursPerWeek: number): number {
  if (hoursPerWeek <= 0) return 0;
  return hours / hoursPerWeek;
}

function packageExpectedHours(pkg: WorkPackage, hoursOverride?: ThreePoint): number {
  if (hoursOverride) {
    return pertExpectedFrom(hoursOverride);
  }
  let total = 0;
  for (const role of pkg.roleEffort) {
    total += pertExpectedFrom(role.hours);
  }
  return total;
}

/**
 * Critical-path style schedule:
 * - Packages in different lanes may run in parallel once dependencies are met.
 * - Same-lane packages are serial within that lane.
 * - Adds review, external approval, stabilisation, and app-store buffers when relevant.
 */
export function estimateTimeline(
  packageIds: string[],
  config: PricingConfig,
  answers: EngineAnswers,
  hoursByPackage?: Map<string, ThreePoint>,
): TimelineRange & { laneWeeks: LaneSchedule[]; criticalPathWeeks: number; notes: string[] } {
  const byId = new Map(config.workPackages.map((p) => [p.id, p]));
  const selected = packageIds.filter((id) => byId.has(id)).sort();
  const notes: string[] = [];
  const hoursPerWeek = config.timeline.hoursPerWeekPerLane;

  const startWeekByPackage = new Map<string, number>();
  const durationByPackage = new Map<string, number>();
  const laneEnd = new Map<string, number>();

  for (const id of selected) {
    const pkg = byId.get(id)!;
    const hours = packageExpectedHours(pkg, hoursByPackage?.get(id));
    // Parallelism within a package across roles ≈ 0.65 effective (coordination)
    durationByPackage.set(id, hoursToWeeks(hours * 0.65, hoursPerWeek));
  }

  const remaining = new Set(selected);
  let guard = 0;
  while (remaining.size > 0 && guard < selected.length + 5) {
    guard++;
    const ready = [...remaining]
      .filter((id) => {
        const deps = (byId.get(id)?.dependsOn ?? []).filter((d) => selected.includes(d));
        return deps.every((d) => startWeekByPackage.has(d));
      })
      .sort();

    const batch = ready.length > 0 ? ready : [[...remaining].sort()[0]!];

    for (const id of batch) {
      if (!remaining.has(id)) continue;
      const pkg = byId.get(id)!;
      const lane = pkg.lane ?? id;
      const deps = (pkg.dependsOn ?? []).filter((d) => selected.includes(d));
      const depEnd = deps.reduce((max, d) => {
        const start = startWeekByPackage.get(d) ?? 0;
        const dur = durationByPackage.get(d) ?? 0;
        return Math.max(max, start + dur);
      }, 0);
      const start = Math.max(laneEnd.get(lane) ?? 0, depEnd);
      const dur = durationByPackage.get(id) ?? 0;
      startWeekByPackage.set(id, start);
      laneEnd.set(lane, start + dur);
      remaining.delete(id);
    }
  }

  for (const id of [...remaining].sort()) {
    const lastEnd = [...startWeekByPackage.entries()].reduce((max, [pid, start]) => {
      return Math.max(max, start + (durationByPackage.get(pid) ?? 0));
    }, 0);
    startWeekByPackage.set(id, lastEnd);
    remaining.delete(id);
    notes.push(`Dependency cycle or unresolved edge involving ${id}; scheduled serially.`);
  }

  const criticalPathWeeks = [...startWeekByPackage.entries()].reduce((max, [id, start]) => {
    return Math.max(max, start + (durationByPackage.get(id) ?? 0));
  }, 0);

  const laneWeeks = [...laneEnd.entries()]
    .map(([lane, weeks]) => ({ lane, weeks }))
    .sort((a, b) => a.lane.localeCompare(b.lane));

  let buffer = config.timeline.reviewCycleWeeks + config.timeline.stabilisationWeeks;

  const hasExternal =
    (Array.isArray(answers.integrations) && answers.integrations.length > 0) ||
    Boolean(answers.regulated);
  if (hasExternal) {
    buffer += config.timeline.externalApprovalWeeks;
    notes.push("Includes time for external approvals / integration availability.");
  }

  const hasMobile =
    selected.includes("wp.mobile") ||
    (Array.isArray(answers.surfaces) &&
      answers.surfaces.some((s) => String(s).toLowerCase().includes("mobile_app")));
  if (hasMobile) {
    buffer += config.timeline.appStoreWeeks;
    notes.push("Includes app-store review buffer for mobile release.");
  }

  if (selected.includes("wp.migration")) {
    buffer += 1;
    notes.push("Includes migration trial-load and cutover buffer.");
  }

  const likelyWeeks = Math.ceil(criticalPathWeeks + buffer);
  const essentialBuffer =
    config.timeline.reviewCycleWeeks + (hasMobile ? config.timeline.appStoreWeeks : 0);
  const minimumWeeks = Math.max(1, Math.ceil(criticalPathWeeks + essentialBuffer * 0.75));

  const timing = String(answers.timing ?? answers.deadline ?? "").toLowerCase();
  if (timing.includes("urgent") || timing.includes("asap") || timing.includes("aggressive")) {
    notes.push(
      "Stated timing is aggressive relative to a credible plan; the window below is a realistic delivery range, not a compressed promise.",
    );
  }
  const weeksMatch = timing.match(/(\d+)\s*week/);
  if (weeksMatch) {
    const requested = Number(weeksMatch[1]);
    if (requested > 0 && requested < minimumWeeks) {
      notes.push(
        `A ${requested}-week target is below the realistic minimum of ${minimumWeeks} weeks for this scope; phasing or discovery is recommended instead of compressing the plan.`,
      );
    }
  }

  return {
    minimumWeeks: Math.min(minimumWeeks, likelyWeeks),
    likelyWeeks: Math.max(likelyWeeks, minimumWeeks),
    laneWeeks,
    criticalPathWeeks,
    notes,
  };
}
