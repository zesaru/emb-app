import type { CompensatorysEntity } from "@/types/collections";

export type CompensatoryMovement = Pick<
  CompensatorysEntity,
  | "id" | "user_id" | "event_date" | "compensated_hours_day" | "event_name"
  | "hours" | "compensated_hours" | "approve_request" | "final_approve_request"
  | "cancelled_at" | "t_time_start"
>;

export type CompensatoryHistoryRow = CompensatoryMovement & {
  movementDate: string | null;
  runningBalance: number;
};

const PAGE_SIZE = 25;

export function isCompensatoryMovementApproved(row: CompensatoryMovement) {
  return row.approve_request === true || row.final_approve_request === true;
}

export function buildCompensatoryHistory(
  movements: CompensatoryMovement[],
  filters: { year?: string; page?: string },
) {
  // Both movement dates are PostgreSQL date columns and represent calendar days.
  const chronological = movements.map((row) => ({
    ...row,
    movementDate: row.event_date ?? row.compensated_hours_day,
  })).sort((a, b) =>
    (a.movementDate ?? "9999-99-99").localeCompare(b.movementDate ?? "9999-99-99") ||
    a.id.localeCompare(b.id),
  );

  const availableYears = new Set<string>();
  let runningBalance = 0;
  let totalEntries = 0;
  let totalExits = 0;
  const rows: CompensatoryHistoryRow[] = [];
  const year = filters.year && /^\d{4}$/.test(filters.year) ? filters.year : undefined;
  for (const row of chronological) {
    const movementYear = row.movementDate?.slice(0, 4);
    if (movementYear) availableYears.add(movementYear);

    const hoursIn = Number(row.hours ?? 0);
    const hoursOut = Number(row.compensated_hours ?? 0);
    // Earlier approved movements carry forward into the first row of any year or page.
    if (isCompensatoryMovementApproved(row) && !row.cancelled_at) {
      runningBalance += hoursIn - hoursOut;
    }

    if (year && movementYear !== year) continue;
    totalEntries += hoursIn;
    totalExits += hoursOut;
    rows.push({ ...row, runningBalance });
  }

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number(filters.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, pages)
    : 1;
  const start = (page - 1) * PAGE_SIZE;
  if (year) availableYears.add(year);

  return {
    rows: rows.slice(start, start + PAGE_SIZE),
    years: Array.from(availableYears).sort((a, b) => b.localeCompare(a)),
    year,
    page,
    pages,
    total,
    first: total > 0 ? start + 1 : 0,
    last: Math.min(start + PAGE_SIZE, total),
    totalEntries,
    totalExits,
  };
}
