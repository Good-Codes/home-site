import { defaultPostLoginPath } from "./roles";

/**
 * Allow only same-origin relative paths. Reject protocol-relative and absolute URLs.
 */
export function safeCallbackPath(
  next: string | null | undefined,
  fallback = "/custom-software-estimator",
): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  return trimmed;
}

export function postAuthRedirect(
  next: string | null | undefined,
  role: string | null | undefined,
): string {
  if (!next) return defaultPostLoginPath(role);
  return safeCallbackPath(next, defaultPostLoginPath(role));
}
