import {
  AUTH_RATE_LIMIT_MAX_HITS,
  AUTH_RATE_LIMIT_WINDOW_MS,
} from "./constants";

const hits = new Map<string, number[]>();

export function checkAuthRateLimit(key: string): boolean {
  const now = Date.now();
  const previous = (hits.get(key) ?? []).filter(
    (stamp) => now - stamp < AUTH_RATE_LIMIT_WINDOW_MS,
  );
  if (previous.length >= AUTH_RATE_LIMIT_MAX_HITS) {
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

export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "anonymous";
}
