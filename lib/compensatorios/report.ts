import { CompensatorysWithUser } from "@/types/collections";

export type CompensatoryReportRow = {
  userId: string;
  name: string;
  email: string;
  registeredHours: number;
  approvedHours: number;
  usedHours: number;
  balance: number;
};

export function buildCompensatoryReport(rows: CompensatorysWithUser[]): CompensatoryReportRow[] {
  const grouped = new Map<string, CompensatoryReportRow>();

  for (const row of rows) {
    const userId = row.user_id || row.user1?.id || "unknown";
    const current = grouped.get(userId) || {
      userId,
      name: String(row.user1?.name || row.user1?.email || "Usuario"),
      email: String(row.user1?.email || ""),
      registeredHours: 0,
      approvedHours: 0,
      usedHours: 0,
      balance: 0,
    };

    const registeredHours = Number(row.hours || 0);
    const approvedHours = row.approve_request ? registeredHours : 0;
    const usedHours = Number(row.compensated_hours || 0);

    current.registeredHours += registeredHours;
    current.approvedHours += approvedHours;
    current.usedHours += usedHours;
    current.balance = current.approvedHours - current.usedHours;
    grouped.set(userId, current);
  }

  return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getReportTotals(rows: CompensatoryReportRow[]) {
  return rows.reduce(
    (totals, row) => ({
      registeredHours: totals.registeredHours + row.registeredHours,
      approvedHours: totals.approvedHours + row.approvedHours,
      usedHours: totals.usedHours + row.usedHours,
      balance: totals.balance + row.balance,
    }),
    { registeredHours: 0, approvedHours: 0, usedHours: 0, balance: 0 },
  );
}
