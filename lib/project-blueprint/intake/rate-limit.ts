/**
 * In-memory rate limit for intake requests (per Node process).
 */

export { clientKeyFromRequest } from "@/lib/http/client-key";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 12;

const hits = new Map<string, number[]>();

export function checkIntakeRateLimit(key: string): boolean {
  const now = Date.now();
  const previous = (hits.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (previous.length >= MAX_HITS) {
    hits.set(key, previous);
    return false;
  }
  previous.push(now);
  hits.set(key, previous);
  return true;
}

export function resetIntakeRateLimitForTests(): void {
  hits.clear();
}
