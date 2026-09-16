import { runtimeEnv } from "@/lib/env/runtime";

/**
 * Secure cookies need HTTPS. Docker Compose is NODE_ENV=production on http://127.0.0.1:3002,
 * so a NODE_ENV check would drop the session cookie in the browser.
 */
export function useSecureAuthCookies(): boolean {
  const url = runtimeEnv("AUTH_URL") ?? runtimeEnv("NEXTAUTH_URL") ?? "";
  if (url) return url.startsWith("https://");
  return process.env.NODE_ENV === "production";
}
