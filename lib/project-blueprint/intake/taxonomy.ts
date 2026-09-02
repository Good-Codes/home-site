/**
 * Catalogue ID helpers for OpenAI intake.
 * Keeps model output constrained to published taxonomy values.
 */

import {
  CATALOGUE_FOLLOW_UPS,
  CATALOGUE_QUESTIONS,
} from "../questions/catalogue";

let cachedIds: Set<string> | null = null;

export function getCatalogueOptionIds(): Set<string> {
  if (cachedIds) return cachedIds;
  const ids = new Set<string>();
  for (const question of [...CATALOGUE_QUESTIONS, ...CATALOGUE_FOLLOW_UPS]) {
    for (const option of question.options ?? []) {
      ids.add(option.id);
    }
  }
  cachedIds = ids;
  return ids;
}

export function isCatalogueOptionId(id: string): boolean {
  return getCatalogueOptionIds().has(id);
}

export function filterCatalogueIds(ids: string[] | undefined, cap: number): string[] {
  if (!ids?.length) return [];
  const allowed = getCatalogueOptionIds();
  const unique: string[] = [];
  for (const id of ids) {
    if (!allowed.has(id)) continue;
    if (unique.includes(id)) continue;
    unique.push(id);
    if (unique.length >= cap) break;
  }
  return unique;
}

/** Compact taxonomy list for the intake system prompt. */
export function buildTaxonomyPrompt(): string {
  const lines: string[] = [];
  for (const question of CATALOGUE_QUESTIONS) {
    if (!question.options?.length) continue;
    if (question.answerKey === "budgetBand") continue;
    const kind =
      question.allowMultiple || question.inputType === "multi_select"
        ? "multi"
        : "single";
    const opts = question.options
      .map((option) => `${option.id} = ${option.label}`)
      .join("; ");
    lines.push(`${String(question.answerKey)} [${kind}]: ${opts}`);
  }
  return lines.join("\n");
}
