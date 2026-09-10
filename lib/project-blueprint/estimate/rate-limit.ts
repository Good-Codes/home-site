/**
 * In-memory rate limit for AI estimate requests.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 6;

const hits = new Map<string, number[]>();

export function checkEstimateRateLimit(key: string): boolean {
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

export function resetEstimateRateLimitForTests(): void {
  hits.clear();
}
