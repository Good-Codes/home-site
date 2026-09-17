import { formatWeeks, formatZarAmount, formatZarRange } from "@/lib/project-blueprint/format";
import type {
  IntakeConcept,
  PhaseBreakdownItem,
  PublicConfidence,
  PublicEstimateResult,
} from "@/lib/project-blueprint/types";
import { escapeHtml } from "@/lib/security/text";

import { getEstimateDocumentAssets } from "./assets";
import {
  ESTIMATE_PDF_CONTACT_EMAIL,
  ESTIMATE_PDF_CONTACT_PHONE,
  ESTIMATE_PDF_CONTACT_URL,
  ESTIMATE_PDF_CONTACT_URL_LABEL,
  ESTIMATE_PDF_DISCLAIMER,
  ESTIMATE_PDF_RETENTION,
  ESTIMATE_PDF_TAGLINE,
} from "./disclaimer";

function documentCss(fontFaceCss: string): string {
  return `
    ${fontFaceCss}
    :root {
      --gc-teal: #67AFA7;
      --gc-pale-teal: #98D4CD;
      --gc-ink: #ECEFF4;
      --gc-night: #0F1117;
      --gc-surface: #171B21;
      --gc-muted: #1D2127;
      --gc-border: #2E333B;
      --gc-secondary: #A6ADB6;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    html {
      color-scheme: dark;
      background: var(--gc-night);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      background: var(--gc-night);
      color: var(--gc-ink);
      font-family: "Geist Sans", ui-sans-serif, system-ui, sans-serif;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.55;
    }
    .sheet {
      width: 100%;
      border-collapse: collapse;
      background: var(--gc-night);
    }
    .sheet thead { display: table-header-group; }
    .sheet tfoot { display: table-footer-group; }
    .sheet tbody { display: table-row-group; }
    .sheet td {
      border: 0;
      padding: 0;
      vertical-align: top;
    }
    .sheet-top,
    .sheet-bottom {
      height: 18mm;
      min-height: 18mm;
      background: var(--gc-night);
    }
    .document {
      padding: 0 18mm;
    }
    a {
      color: var(--gc-pale-teal);
      text-decoration: none;
    }
    h1, h2, h3, p, ul { margin: 0; }
    h1, h2 { break-after: avoid; page-break-after: avoid; }
    li {
      orphans: 2;
      widows: 2;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      line-height: 1.15;
      letter-spacing: -0.02em;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      line-height: 1.25;
      margin: 0 0 12px;
    }
    .eyebrow {
      color: var(--gc-secondary);
      font-family: "Geist Mono", ui-monospace, monospace;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.02em;
      line-height: 1.4;
    }
    .lede {
      max-width: 62ch;
      margin-top: 12px;
      color: var(--gc-ink);
    }
    .subtle {
      margin-top: 8px;
      color: var(--gc-secondary);
      font-size: 13px;
    }
    header.masthead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      overflow: visible;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--gc-border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .brand img {
      display: block;
      width: 11mm;
      height: 11mm;
      object-fit: contain;
      overflow: visible;
    }
    .brand-name {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.2;
    }
    .brand-product {
      margin-top: 2px;
      color: var(--gc-secondary);
      font-size: 12px;
      line-height: 1.4;
      white-space: nowrap;
    }
    .doc-meta {
      text-align: right;
      flex: 0 1 auto;
      min-width: 0;
    }
    .doc-meta .ref {
      color: var(--gc-secondary);
      font-family: "Geist Mono", ui-monospace, monospace;
      font-size: 11px;
      font-variant-numeric: tabular-nums;
      line-height: 1.4;
    }
    .intro { margin-top: 32px; }
    .keep {
      display: table;
      width: 100%;
      margin-top: 24px;
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    .keep-lg { margin-top: 32px; }
    .notice {
      border-radius: 12px;
      overflow: hidden;
      padding: 16px 20px;
      background: var(--gc-muted);
      border: 1px solid var(--gc-border);
    }
    .notice .eyebrow { margin-bottom: 8px; }
    .notice p + p { margin-top: 8px; }
    .card {
      border-radius: 12px;
      overflow: hidden;
      background: var(--gc-surface);
      border: 1px solid var(--gc-border);
      padding: 20px;
    }
    .range-card {
      padding-left: 20px;
      border-left: 3px solid var(--gc-teal);
    }
    .range {
      margin: 8px 0 12px;
      color: var(--gc-ink);
      font-family: "Geist Sans", ui-sans-serif, system-ui, sans-serif;
      font-size: 28px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
      line-height: 1.15;
      white-space: nowrap;
    }
    .range-meta {
      color: var(--gc-secondary);
      font-variant-numeric: tabular-nums;
    }
    .range-meta + .range-meta { margin-top: 4px; }
    .confidence {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--gc-border);
    }
    .confidence-label {
      font-size: 13px;
      font-weight: 600;
    }
    .confidence p + p,
    .confidence p + ul { margin-top: 8px; }
    .confidence .follow-on { margin-top: 16px; }
    section { margin-top: 32px; }
    .scenario-grid,
    .split {
      display: grid;
      gap: 16px;
    }
    .scenario-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .scenario-grid .keep { margin-top: 0; }
    .split { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .scenario .amount {
      margin-top: 8px;
      color: var(--gc-pale-teal);
      font-family: "Geist Sans", ui-sans-serif, system-ui, sans-serif;
      font-size: 16px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .scenario .summary { margin-top: 8px; color: var(--gc-secondary); }
    ul.plain {
      padding-left: 18px;
    }
    ul.plain li + li { margin-top: 6px; }
    .phase {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--gc-border);
    }
    .phase:first-of-type { padding-top: 0; }
    .phase:last-of-type { padding-bottom: 0; border-bottom: 0; }
    .phase .amount {
      flex: 0 0 auto;
      color: var(--gc-ink);
      font-family: "Geist Sans", ui-sans-serif, system-ui, sans-serif;
      font-size: 13px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .phase .name { font-weight: 600; }
    .phase .desc {
      margin-top: 4px;
      color: var(--gc-secondary);
      font-size: 13px;
    }
    .driver + .driver { margin-top: 12px; }
    .driver {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .driver p + p { margin-top: 4px; color: var(--gc-secondary); }
    .next-step p { margin-top: 8px; max-width: 62ch; }
    footer.document-end {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--gc-border);
      color: var(--gc-secondary);
      font-size: 12px;
      line-height: 1.5;
    }
    footer.document-end .tagline {
      color: var(--gc-ink);
      font-weight: 500;
    }
    footer.document-end p + p { margin-top: 8px; }
    .contact {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      font-family: "Geist Mono", ui-monospace, monospace;
      font-size: 11px;
    }
    .range-card, .card, .notice, .phase, .split > div, footer.document-end {
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
  `;
}

function keep(html: string, className = "keep"): string {
  return `<div class="${className}">${html}</div>`;
}

function assumptionText(item: { text: string } | string): string {
  return typeof item === "string" ? item : item.text;
}

function list(items: string[]): string {
  if (items.length === 0) return "";
  return `<ul class="plain">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function confidenceLabel(level: PublicConfidence["level"]): string {
  if (level === "high") return "High confidence";
  if (level === "moderate") return "Moderate confidence";
  return "Early-stage estimate";
}

function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeZone: "Africa/Johannesburg",
  }).format(date);
}

function formatAllocation(allocation: PhaseBreakdownItem["allocation"]): string {
  if ("low" in allocation && "high" in allocation) {
    return formatZarRange(allocation);
  }
  if ("share" in allocation) {
    return `${Math.round(allocation.share * 100)}%`;
  }
  return "";
}

function logoMarkup(src: string): string {
  if (!src) return "";
  return `<img src="${src}" alt="" width="42" height="42" />`;
}

export function renderEstimateDocumentHtml(input: {
  result: PublicEstimateResult;
  referenceId: string;
  concept?: IntakeConcept;
}): string {
  const { result, concept } = input;
  const { logoSrc, fontFaceCss } = getEstimateDocumentAssets();
  const generated = result.generatedAt ? formatGeneratedAt(result.generatedAt) : "";
  const alternatives = result.alternativeScenarios.filter(
    (item) => item.id !== result.recommendedScenario.id,
  );
  const rec = result.recommendedScenario;

  const conceptSummary = concept?.summary
    ? `<p class="lede">${escapeHtml(concept.summary)}</p>`
    : "";
  const who = concept?.whoItsFor
    ? `<p class="subtle">For: ${escapeHtml(concept.whoItsFor)}</p>`
    : "";
  const capabilities =
    concept?.coreCapabilities && concept.coreCapabilities.length > 0
      ? `<section>
          <h2>Concept we estimated</h2>
          ${list(concept.coreCapabilities)}
        </section>`
      : "";

  const likely = `<p class="range-meta">Likely around ${escapeHtml(
    formatZarAmount(rec.range.likely),
  )}</p>`;
  const timeline = `<p class="range-meta">${escapeHtml(
    formatWeeks(
      rec.timeline.minimumWeeks,
      rec.timeline.likelyWeeks,
      rec.timeline.maximumWeeks,
    ),
  )}</p>`;
  const scenarioSummary = rec.summary
    ? `<p class="subtle">${escapeHtml(rec.summary)}</p>`
    : "";

  const discoveryHtml =
    result.discoveryRecommended || result.discoverySummary
      ? `<section>
          ${keep(`<div class="notice">
            <p class="eyebrow">Begin with discovery</p>
            <p>${escapeHtml(
              result.discoverySummary ||
                "A discovery phase would let us replace open assumptions with verified requirements.",
            )}</p>
          </div>`)}
        </section>`
      : "";

  const alternativeHtml =
    alternatives.length > 0
      ? `<section>
          <h2>Other scenarios</h2>
          <div class="scenario-grid">
            ${alternatives
              .map((scenario) => {
                const summary = scenario.summary
                  ? `<p class="summary">${escapeHtml(scenario.summary)}</p>`
                  : "";
                return keep(`<article class="card scenario">
                  <p class="eyebrow">${escapeHtml(scenario.name)}</p>
                  <p class="amount">${escapeHtml(formatZarRange(scenario.range))}</p>
                  <p class="subtle">${escapeHtml(
                    formatWeeks(
                      scenario.timeline.minimumWeeks,
                      scenario.timeline.likelyWeeks,
                      scenario.timeline.maximumWeeks,
                    ),
                  )}</p>
                  ${summary}
                </article>`);
              })
              .join("")}
          </div>
        </section>`
      : "";

  const phasesHtml =
    result.phaseBreakdown.length > 0
      ? `<section>
          <h2>Cost by phase</h2>
          ${result.phaseBreakdown
            .map((phase) => {
              const amount = formatAllocation(phase.allocation);
              const description = phase.description
                ? `<p class="desc">${escapeHtml(phase.description)}</p>`
                : "";
              return `<div class="phase">
                <div>
                  <p class="name">${escapeHtml(phase.name)}</p>
                  ${description}
                </div>
                ${amount ? `<p class="amount">${escapeHtml(amount)}</p>` : ""}
              </div>`;
            })
            .join("")}
        </section>`
      : "";

  const driversHtml =
    result.costDrivers.length > 0
      ? `<section>
          <h2>What moves the range</h2>
          ${result.costDrivers
            .map(
              (driver) =>
                `<div class="driver">
                  <p><strong>${escapeHtml(driver.title)}</strong></p>
                  <p>${escapeHtml(driver.explanation)}</p>
                </div>`,
            )
            .join("")}
        </section>`
      : "";

  const assumptionsList = list(result.assumptions.map((item) => assumptionText(item)));
  const exclusionsList = list(result.exclusions);
  const splitHtml =
    result.assumptions.length > 0 || result.exclusions.length > 0
      ? `<section class="split">
          ${
            result.assumptions.length > 0
              ? `<div><h2>Assumptions</h2>${assumptionsList}</div>`
              : ""
          }
          ${
            result.exclusions.length > 0
              ? `<div><h2>Exclusions</h2>${exclusionsList}</div>`
              : ""
          }
        </section>`
      : "";

  const improveItems =
    result.confidence.improvements.length > 0
      ? result.confidence.improvements
      : result.confidence.unknowns;
  const improveHtml =
    improveItems.length > 0
      ? `<p class="confidence-label follow-on">What would improve this range</p>
         ${list(improveItems)}`
      : "";

  const generatedLabel = generated
    ? `<div class="doc-meta"><p class="ref">${escapeHtml(generated)}</p></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" class="theme-dark">
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="dark" />
  <title>Good Code · Planning estimate</title>
  <style>${documentCss(fontFaceCss)}</style>
</head>
<body>
<table class="sheet">
  <thead>
    <tr><td class="sheet-top">&nbsp;</td></tr>
  </thead>
  <tfoot>
    <tr><td class="sheet-bottom">&nbsp;</td></tr>
  </tfoot>
  <tbody>
    <tr>
      <td>
<div class="document">
  <header class="masthead">
    <div class="brand">
      ${logoMarkup(logoSrc)}
      <div>
        <p class="brand-name">Good Code</p>
        <p class="brand-product">Project Blueprint · Planning estimate</p>
      </div>
    </div>
    ${generatedLabel}
  </header>

  <div class="intro">
    <h1>${escapeHtml(result.productSummary)}</h1>
    ${conceptSummary}
    ${who}
  </div>

  ${keep(`<aside class="notice">
    <p class="eyebrow">Planning estimate</p>
    <p>${escapeHtml(ESTIMATE_PDF_DISCLAIMER)}</p>
  </aside>`)}

  ${keep(`<section class="card range-card">
    <p class="eyebrow">Recommended investment range</p>
    <p class="range">${escapeHtml(formatZarRange(rec.range))}</p>
    ${likely}
    ${timeline}
    ${scenarioSummary}
    <div class="confidence">
      <p class="confidence-label">${escapeHtml(
        confidenceLabel(result.confidence.level),
      )}</p>
      <p>${escapeHtml(result.confidence.explanation)}</p>
      ${improveHtml}
    </div>
  </section>`)}

  ${discoveryHtml}
  ${capabilities}
  ${alternativeHtml}
  ${phasesHtml}
  ${driversHtml}
  ${splitHtml}

  ${keep(
    `<section class="notice next-step">
    <h2>Recommended next step</h2>
    <p>${escapeHtml(result.nextStepRecommendation)}</p>
  </section>`,
    "keep keep-lg",
  )}

  <footer class="document-end">
    <p class="tagline">${escapeHtml(ESTIMATE_PDF_TAGLINE)}</p>
    <p>${escapeHtml(ESTIMATE_PDF_RETENTION)}</p>
    <p class="contact">
      <span>Good Code</span>
      <a href="mailto:${ESTIMATE_PDF_CONTACT_EMAIL}">${escapeHtml(
        ESTIMATE_PDF_CONTACT_EMAIL,
      )}</a>
      <a href="tel:${ESTIMATE_PDF_CONTACT_PHONE.replace(/\s+/g, "")}">${escapeHtml(ESTIMATE_PDF_CONTACT_PHONE)}</a>
      <a href="${ESTIMATE_PDF_CONTACT_URL}">${escapeHtml(
        ESTIMATE_PDF_CONTACT_URL_LABEL,
      )}</a>
    </p>
  </footer>
</div>
      </td>
    </tr>
  </tbody>
</table>
</body>
</html>`;
}
