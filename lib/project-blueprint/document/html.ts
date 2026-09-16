import { formatWeeks, formatZarRange } from "@/lib/project-blueprint/format";
import type {
  IntakeConcept,
  PublicEstimateResult,
} from "@/lib/project-blueprint/types";
import { escapeHtml } from "@/lib/security/text";

import {
  ESTIMATE_PDF_CONTACT,
  ESTIMATE_PDF_DISCLAIMER,
} from "./disclaimer";

const styles = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: #171717;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 12px;
    line-height: 1.5;
  }
  h1 { font-size: 22px; margin: 0 0 8px; }
  h2 { font-size: 15px; margin: 22px 0 8px; }
  p { margin: 0 0 8px; }
  ul { margin: 0 0 8px; padding-left: 18px; }
  .banner {
    background: #f4e7d8;
    border: 1px solid #c4a574;
    padding: 12px 14px;
    margin-bottom: 18px;
    font-weight: 600;
  }
  .meta { color: #525252; font-size: 11px; margin-bottom: 16px; }
  .range { font-size: 20px; font-weight: 700; margin: 4px 0 12px; }
  footer {
    margin-top: 28px;
    padding-top: 12px;
    border-top: 1px solid #d4d4d4;
    font-size: 11px;
    color: #404040;
  }
`;

function assumptionText(item: { text: string } | string): string {
  return typeof item === "string" ? item : item.text;
}

function list(items: string[]): string {
  if (items.length === 0) return "";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

export function renderEstimateDocumentHtml(input: {
  result: PublicEstimateResult;
  referenceId: string;
  concept?: IntakeConcept;
}): string {
  const { result, referenceId, concept } = input;
  const generated = result.generatedAt
    ? new Date(result.generatedAt).toLocaleString("en-ZA")
    : "";
  const alternatives = result.alternativeScenarios.filter(
    (item) => item.id !== result.recommendedScenario.id,
  );
  const rec = result.recommendedScenario;

  const alternativeHtml =
    alternatives.length > 0
      ? `<h2>Other scenarios</h2>${alternatives
          .map((scenario) => {
            const summary = scenario.summary
              ? ` — ${escapeHtml(scenario.summary)}`
              : "";
            return `<p><strong>${escapeHtml(scenario.name)}:</strong> ${escapeHtml(
              formatZarRange(scenario.range),
            )} (${escapeHtml(
              formatWeeks(
                scenario.timeline.minimumWeeks,
                scenario.timeline.likelyWeeks,
                scenario.timeline.maximumWeeks,
              ),
            )})${summary}</p>`;
          })
          .join("")}`
      : "";

  const phasesHtml =
    result.phaseBreakdown.length > 0
      ? `<h2>Workstreams</h2><ul>${result.phaseBreakdown
          .map((phase) => {
            const description = phase.description
              ? ` — ${escapeHtml(phase.description)}`
              : "";
            return `<li><strong>${escapeHtml(phase.name)}</strong>${description}</li>`;
          })
          .join("")}</ul>`
      : "";

  const driversHtml =
    result.costDrivers.length > 0
      ? `<h2>What moves the range</h2><ul>${result.costDrivers
          .map(
            (driver) =>
              `<li><strong>${escapeHtml(driver.title)}.</strong> ${escapeHtml(
                driver.explanation,
              )}</li>`,
          )
          .join("")}</ul>`
      : "";

  const assumptionsHtml =
    result.assumptions.length > 0
      ? `<h2>Assumptions</h2>${list(
          result.assumptions.map((item) => assumptionText(item)),
        )}`
      : "";

  const exclusionsHtml =
    result.exclusions.length > 0
      ? `<h2>Exclusions</h2>${list(result.exclusions)}`
      : "";

  const unknownsHtml =
    result.confidence.unknowns.length > 0
      ? list(result.confidence.unknowns)
      : "";

  const conceptSummary = concept?.summary
    ? `<p>${escapeHtml(concept.summary)}</p>`
    : "";
  const who = concept?.whoItsFor
    ? `<p>For: ${escapeHtml(concept.whoItsFor)}</p>`
    : "";
  const scenarioSummary = rec.summary ? `<p>${escapeHtml(rec.summary)}</p>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Project Blueprint planning estimate</title>
  <style>${styles}</style>
</head>
<body>
  <p class="meta">Good Code · Project Blueprint</p>
  <div class="banner">${escapeHtml(ESTIMATE_PDF_DISCLAIMER)}</div>
  <h1>${escapeHtml(result.productSummary)}</h1>
  ${conceptSummary}
  ${who}
  <p class="meta">Reference ${escapeHtml(referenceId)}${
    generated ? ` · Generated ${escapeHtml(generated)}` : ""
  } · Currency ZAR</p>
  <h2>Recommended investment range</h2>
  <p class="range">${escapeHtml(formatZarRange(rec.range))}</p>
  <p>Likely delivery window: ${escapeHtml(
    formatWeeks(
      rec.timeline.minimumWeeks,
      rec.timeline.likelyWeeks,
      rec.timeline.maximumWeeks,
    ),
  )}</p>
  ${scenarioSummary}
  ${alternativeHtml}
  ${phasesHtml}
  ${driversHtml}
  ${assumptionsHtml}
  ${exclusionsHtml}
  <h2>Confidence</h2>
  <p>${escapeHtml(result.confidence.level)} — ${escapeHtml(
    result.confidence.explanation,
  )}</p>
  ${unknownsHtml}
  <h2>Recommended next step</h2>
  <p>${escapeHtml(result.nextStepRecommendation)}</p>
  <footer>
    <p>${escapeHtml(ESTIMATE_PDF_DISCLAIMER)}</p>
    <p>${escapeHtml(ESTIMATE_PDF_CONTACT)}</p>
  </footer>
</body>
</html>`;
}
