import type { JapanServiceBand, JapanVacationRuleType } from "./japan-vacation-grants";

export type VacationGrantHistoryItem = {
  id: string;
  granted_on: string;
  service_band: JapanServiceBand;
  days_granted: number;
  days_remaining: number;
  expires_on: string;
  rule_type: JapanVacationRuleType;
  notes: string | null;
  consumptions: { id: string; days_used: number; consumed_at: string }[];
};

export const SERVICE_BAND_LABELS: Record<JapanServiceBand, string> = {
  "6_months": "6 meses",
  "1_year_6_months": "1 año y 6 meses",
  "2_years_6_months": "2 años y 6 meses",
  "3_years_6_months": "3 años y 6 meses",
  "4_years_6_months": "4 años y 6 meses",
  "5_years_6_months": "5 años y 6 meses",
  "6_years_6_months_plus": "6 años y 6 meses o más",
};
export const GRANT_RULE_LABELS: Record<JapanVacationRuleType, string> = {
  manual: "Manual",
  standard: "Estándar",
  proportional: "Proporcional",
};
