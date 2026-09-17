import "server-only";

import { existsSync } from "node:fs";

function chromeExecutablePath(): string | undefined {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  const candidates = [
    fromEnv,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
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
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="width:100%;color:#A6ADB6;font-size:9px;line-height:12px;font-family:ui-sans-serif,system-ui,sans-serif;display:flex;justify-content:flex-end;padding:0 18mm 8mm;box-sizing:border-box;">
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
