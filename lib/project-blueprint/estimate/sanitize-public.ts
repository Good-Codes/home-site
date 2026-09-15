import type { PublicEstimateResult } from "@/lib/project-blueprint/types";

export function sanitizePublicResult(
  raw: Record<string, unknown>,
): PublicEstimateResult {
  const {
    privateTrace: _privateTrace,
    calculationTrace: _calculationTrace,
    rates: _rates,
    margins: _margins,
    roleRates: _roleRates,
    sellRates: _sellRates,
    hours: _hours,
    ...safe
  } = raw;

  void _privateTrace;
  void _calculationTrace;
  void _rates;
  void _margins;
  void _roleRates;
  void _sellRates;
  void _hours;

  return safe as unknown as PublicEstimateResult;
}
