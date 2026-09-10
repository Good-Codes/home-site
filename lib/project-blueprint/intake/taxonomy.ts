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

export function catalogueOptionLabel(id: string): string | undefined {
  for (const question of [...CATALOGUE_QUESTIONS, ...CATALOGUE_FOLLOW_UPS]) {
    const option = question.options?.find((item) => item.id === id);
    if (option) return option.label;
  }
  return undefined;
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

/** Compact high-impact IDs only — intake is not a pricing machine. */
export function buildTaxonomyPrompt(): string {
  return [
    "route (single): route.website = marketing/brochure website; route.custom_web_platform = custom web product; route.customer_portal = customer portal; route.internal_system = internal tool; route.mobile_app = native mobile app; route.saas_multi_tenant = multi-tenant SaaS; route.unsure = still unclear",
    "surfaces (multi): surface.public_web; surface.customer_portal; surface.admin_workspace; surface.native_mobile; surface.public_api; surface.reporting",
    "startingPoint (single): start.new_idea; start.validated_concept; start.existing_product; start.legacy_replacement; start.connect_systems; start.needs_discovery",
    "userGroups (multi): users.customers; users.employees; users.partners; users.admins",
    "capabilities (multi, only if clearly stated): cap.access.registration_login; cap.workflow.status_tracking; cap.payments.one_time; cap.payments.recurring; cap.data.files",
    "integrations (multi): integration.none; integration.payment_gateway; integration.erp; integration.unknown",
    "qualityRequirements (multi): quality.personal_sensitive; quality.financial_info; quality.popia_privacy",
    "timing (single): timing.no_deadline; timing.within_3_months; timing.3_to_6_months; timing.not_sure",
    "Do not set a customer budget. Do not invent IDs. Leave fields empty when unsure and use answers.unknowns.",
  ].join("\n");
}
