import type { ReportPeriod } from "@/lib/reporting/staff-report";
async function request(value: object) {
  const response = await fetch("/fixture-report", { method: "POST", body: JSON.stringify(value) });
  if (!response.ok) throw new Error("Fallo simulado de lectura");
  return response.json();
}
export const getStaffReport = (period: ReportPeriod) => request({ period });
export const getIndividualStaffReport = (input: { userId: string; period: ReportPeriod }) =>
  request(input);
