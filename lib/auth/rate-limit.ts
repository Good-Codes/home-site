import {
  AUTH_RATE_LIMIT_MAX_HITS,
  AUTH_RATE_LIMIT_WINDOW_MS,
} from "./constants";

export {
  clientKeyFromHeaders,
  clientKeyFromRequest,
} from "@/lib/http/client-key";

const hits = new Map<string, number[]>();

export function checkAuthRateLimit(
  key: string,
  maxHits: number = AUTH_RATE_LIMIT_MAX_HITS,
): boolean {
  const now = Date.now();
  const previous = (hits.get(key) ?? []).filter(
    (stamp) => now - stamp < AUTH_RATE_LIMIT_WINDOW_MS,
  );
  if (previous.length >= maxHits) {
    hits.set(key, previous);
    return false;
  }
  previous.push(now);
  hits.set(key, previous);
  return true;
}

export function resetAuthRateLimitForTests(): void {
  hits.clear();
}
