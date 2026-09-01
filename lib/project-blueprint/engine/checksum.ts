/**
 * Stable JSON checksum for deterministic estimate identity.
 * Same canonical answers + config → same checksum → same result.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

/** Recursively sort object keys; sort arrays of primitives; keep array-of-objects order. */
export function canonicalize(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "NaN";
    if (!Number.isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";
    return value;
  }
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "boolean" || typeof value === "string") return value;
  if (Array.isArray(value)) {
    const mapped = value.map(canonicalize);
    const allPrimitive = mapped.every(
      (v) => v === null || typeof v !== "object",
    );
    if (allPrimitive) {
      return [...mapped].sort((a, b) => {
        const sa = JSON.stringify(a);
        const sb = JSON.stringify(b);
        return sa < sb ? -1 : sa > sb ? 1 : 0;
      });
    }
    return mapped;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      // Budget fields are commercial-fit only — exclude from math checksum identity
      // so changing budget alone does not change the estimate math identity.
      // (calculateEstimate still ignores budget; this keeps checksums stable.)
      if (key === "budget" || key === "budgetBand") continue;
      out[key] = canonicalize(value[key]);
    }
    return out;
  }
  return String(value);
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

/** FNV-1a 32-bit → hex, then mix into 64-bit-ish hex for stable short ids. */
function fnv1aHex(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const a = (h >>> 0).toString(16).padStart(8, "0");
  // Second pass with seed offset for extra bits without crypto dependency.
  let h2 = 84696351;
  for (let i = 0; i < input.length; i++) {
    h2 ^= input.charCodeAt(i);
    h2 = Math.imul(h2, 16777619);
  }
  const b = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${a}${b}`;
}

/**
 * Stable checksum of any JSON-serialisable value.
 * Returns a hex string suitable for estimateId / calculationTraceReference fragments.
 */
export function checksum(value: unknown): string {
  return fnv1aHex(stableStringify(value));
}

export function combineChecksums(...parts: string[]): string {
  return checksum(parts);
}
