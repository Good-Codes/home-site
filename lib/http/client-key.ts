import { createHmac } from "node:crypto";

import { runtimeEnv } from "@/lib/env/runtime";

const FALLBACK_PEPPER = "dev-only-insecure-auth-secret-min-32-chars";

type HeaderReader = {
  get(name: string): string | null;
};

function pepper(): string {
  return runtimeEnv("AUTH_SECRET") ?? FALLBACK_PEPPER;
}

function hmac(material: string): string {
  return createHmac("sha256", pepper()).update(material).digest("hex");
}

function lastForwardedHop(value: string): string | null {
  const parts = value.split(",");
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const hop = parts[i]?.trim();
    if (hop) return hop;
  }
  return null;
}

function rawClientIdentity(headers: HeaderReader): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return `ip:${realIp}`;
  }

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const last = lastForwardedHop(forwarded);
    if (last) return `ip:${last}`;
  }

  const userAgent = headers.get("user-agent")?.trim() ?? "";
  const acceptLanguage = headers.get("accept-language")?.trim() ?? "";
  return `fp:${userAgent}\n${acceptLanguage}`;
}

export function clientKeyFromHeaders(headers: HeaderReader): string {
  return hmac(rawClientIdentity(headers));
}

export function clientKeyFromRequest(request: Request): string {
  return clientKeyFromHeaders(request.headers);
}
