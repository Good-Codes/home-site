export const PROFILE_ESTIMATE_LIMIT = 5;

export type SavedEstimateListItem = {
  id: string;
  savedToProfileAt: string;
  productSummary: string;
  rangeLabel: string | null;
};
