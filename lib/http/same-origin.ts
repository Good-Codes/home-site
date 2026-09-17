import { runtimeEnv } from "@/lib/env/runtime";

const PRODUCTION_ORIGINS = [
  "https://www.goodcode.co.za",
  "https://goodcode.co.za",
];

function originFromUrl(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function developmentOrigins(): string[] {
  if (process.env.NODE_ENV === "production") return [];
  const origins: string[] = [];
  for (const host of ["localhost", "127.0.0.1"]) {
    origins.push(`http://${host}`);
    for (const port of ["3000", "3001", "3002", "3003"]) {
      origins.push(`http://${host}:${port}`);
    }
  }
  return origins;
}

export function allowedRequestOrigins(request: Request): Set<string> {
  const origins = new Set<string>();
  const requestOrigin = originFromUrl(request.url);
  if (requestOrigin) origins.add(requestOrigin);

  for (const value of [
    runtimeEnv("AUTH_URL"),
    runtimeEnv("NEXTAUTH_URL"),
    ...PRODUCTION_ORIGINS,
    ...developmentOrigins(),
  ]) {
    if (!value) continue;
    const origin = originFromUrl(value);
    if (origin) origins.add(origin);
  }

  return origins;
}

export function isAllowedRequestOrigin(request: Request): boolean {
  const originHeader = request.headers.get("origin")?.trim();
  const referer = request.headers.get("referer")?.trim();
  const candidate = originHeader || (referer ? originFromUrl(referer) : null);
  if (!candidate) return false;
  return allowedRequestOrigins(request).has(candidate);
}
