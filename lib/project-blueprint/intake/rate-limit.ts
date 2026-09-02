/**
 * In-memory rate limit for public intake requests.
 * Best-effort protection for the OpenAI route (per serverless instance).
 */

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

export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "anonymous";
}
