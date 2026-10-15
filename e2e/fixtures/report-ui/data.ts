import { buildStaffReport } from "@/lib/reporting/staff-report";
import type { IndividualStaffReport } from "@/lib/reporting/staff-report";
const now = new Date("2026-10-15T15:30:00Z");
const period = { from: "2026-01-01", to: "2026-12-31" };
const baseUser = {
  id: "special",
  name: "Persona Especial",
  email: "especial@example.test",
  position: "Secretaría",
  is_active: true,
  is_diplomatic: false,
  hire_date: "2013-03-06",
  grant_mode: "manual",
  manual_next_grant_date: "2026-08-31",
};
const grant = {
  id: "old",
  user_id: "special",
  granted_on: "2026-09-01",
  expires_on: "2027-09-01",
  days_granted: 32,
  days_remaining: 25,
  rule_type: "manual" as const,
  notes: "[internal:marker] Caso especial autorizado por Administración.",
};
const grants = [
  grant,
  { ...grant, id: "new", days_granted: 20, days_remaining: 20, expires_on: "2028-09-01" },
  {
    ...grant,
    id: "urgent",
    user_id: "auto",
    expires_on: "2026-10-16",
    days_granted: 19,
    days_remaining: 19,
  },
];
const vacation = {
  id: "v",
  id_user: "special",
  start: "2026-09-01",
  finish: "2026-09-07",
  days: 7,
  approve_request: true,
  cancelled_at: null,
  request_date: "2026-08-01",
};
const vacations = [
  vacation,
  { ...vacation, id: "future", start: "2026-12-01", finish: "2026-12-02", days: 2 },
  { ...vacation, id: "pending", approve_request: false },
  { ...vacation, id: "cancel", cancelled_at: "2026-08-30" },
  ...Array.from({ length: 24 }, (_, i) => ({ ...vacation, id: `history-${i}`, days: 1 })),
];
export const report = buildStaffReport({
  users: [
    baseUser,
    {
      ...baseUser,
      id: "auto",
      name: "Ana Automática",
      email: "ana@example.test",
      grant_mode: "automatic",
    },
    { ...baseUser, id: "diplomat", name: "Diego Diplomático", is_diplomatic: true },
    { ...baseUser, id: "inactive", name: "Cuenta Inactiva", is_active: false },
  ],
  grants,
  vacations,
  compensatory: [],
  period,
  now,
});
export function individual(id: string): IndividualStaffReport {
  return {
    ...report,
    employee: report.employees.find((e) => e.id === id)!,
    vacations: id === "special" ? vacations : [],
    grants: grants
      .filter((g) => g.user_id === id)
      .map((g) => ({
        ...g,
        service_band: "6_years_6_months_plus",
        consumptions:
          g.id === "old"
            ? [{ id: "consume", days_used: 7, consumed_at: "2026-09-01T00:00:00Z" }]
            : [],
      })),
  };
}
