import { spawn } from "node:child_process";
import { cpSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

const standaloneDir = resolve(process.cwd(), ".next/standalone");
const serverJs = resolve(standaloneDir, "server.js");

if (!existsSync(serverJs)) {
  console.error("Missing .next/standalone/server.js. Run npm run build first.");
  process.exit(1);
}

const staticSrc = resolve(process.cwd(), ".next/static");
const staticDest = resolve(standaloneDir, ".next/static");
if (existsSync(staticSrc)) {
  cpSync(staticSrc, staticDest, { recursive: true });
}

const child = spawn(process.execPath, ["server.js"], {
  cwd: standaloneDir,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: process.env.PORT ?? "3000",
    HOSTNAME: process.env.HOSTNAME ?? "0.0.0.0",
  },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
