import "server-only";

import { existsSync } from "node:fs";

function chromeExecutablePath(): string | undefined {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  const candidates = [
    fromEnv,
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter((path): path is string => Boolean(path));
  return candidates.find((path) => existsSync(path));
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer");
  const executablePath = chromeExecutablePath();

  const browser = await puppeteer.default.launch({
    headless: true,
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", right: "14mm", bottom: "18mm", left: "14mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
