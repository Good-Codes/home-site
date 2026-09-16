/**
 * Read server env at process start/runtime.
 * Use bracket access so Next.js cannot inline `process.env.NAME` to undefined
 * during `docker build` (secrets are dockerignored and absent from the build).
 */
export function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
