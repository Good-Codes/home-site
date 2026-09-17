import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));

export type EstimateDocumentAssets = {
  logoSrc: string;
  fontFaceCss: string;
};

function firstExisting(paths: string[]): string {
  return paths.find((path) => existsSync(path)) ?? "";
}

function readDataUri(filePath: string, mime: string): string {
  if (!filePath || !existsSync(filePath)) return "";
  return `data:${mime};base64,${readFileSync(filePath).toString("base64")}`;
}

function fontFace(family: string, dataUri: string): string {
  if (!dataUri) return "";
  return `@font-face {
  font-family: "${family}";
  src: url("${dataUri}") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}`;
}

let cached: EstimateDocumentAssets | undefined;

export function getEstimateDocumentAssets(): EstimateDocumentAssets {
  if (cached) return cached;

  const sans = readDataUri(
    firstExisting([
      join(DIR, "fonts/Geist-Variable.woff2"),
      join(process.cwd(), "lib/project-blueprint/document/fonts/Geist-Variable.woff2"),
    ]),
    "font/woff2",
  );
  const mono = readDataUri(
    firstExisting([
      join(DIR, "fonts/GeistMono-Variable.woff2"),
      join(
        process.cwd(),
        "lib/project-blueprint/document/fonts/GeistMono-Variable.woff2",
      ),
    ]),
    "font/woff2",
  );
  const logoSrc = readDataUri(
    firstExisting([
      join(DIR, "../../../public/dark_mode_logo.png"),
      join(process.cwd(), "public/dark_mode_logo.png"),
    ]),
    "image/png",
  );

  cached = {
    logoSrc,
    fontFaceCss: [fontFace("Geist Sans", sans), fontFace("Geist Mono", mono)]
      .filter(Boolean)
      .join("\n"),
  };
  return cached;
}
