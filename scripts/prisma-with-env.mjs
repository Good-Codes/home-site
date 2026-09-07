import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Prisma only auto-loads `.env`. Next.js also loads `.env.local`.
 * Merge both (local wins), without overriding variables already set in the shell.
 */
function parseEnvFile(file) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return {};
  const parsed = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

const fromFiles = {
  ...parseEnvFile(".env"),
  ...parseEnvFile(".env.local"),
};

for (const [key, value] of Object.entries(fromFiles)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const args = process.argv.slice(2);
const child = spawn("npx", ["prisma", ...args], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
