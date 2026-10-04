import { createClient } from "@/utils/supabase/server";
import { getRequestUser } from "@/lib/auth/request-user";
import { isAdmin, requireUserActive } from "@/lib/auth/admin-check";
import { vacationDate, vacationMonth, vacationToday } from "@/lib/vacations/dates";
import type { VacationsEntity } from "@/types/collections";

export const VACATION_PAGE_SIZE = 25;
export type VacationRecord = Pick<VacationsEntity, "id" | "id_user" | "request_date" | "start" | "finish" | "days" | "approve_request"> & {
  user1: { id: string; name: string | null; email: string | null } | null;
};
export type VacationFilters = { page?: number; user?: string; status?: "all" | "approved" | "pending"; from?: string; to?: string };

export async function listVacationRecords(filters: VacationFilters = {}, now = new Date()) {
  const { data: { user }, error: authError } = await getRequestUser();
  if (authError || !user) throw new Error("No autenticado");
  await requireUserActive(user.id);
  const admin = await isAdmin(user.id);
  const validDay = (value: string | undefined) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && vacationDate(value) === value);
  if (!validDay(filters.from) || !validDay(filters.to) || (filters.from && filters.to && filters.from > filters.to)) {
    throw new Error("Periodo no válido");
  }
  const supabase = await createClient();
  const search = filters.user?.trim();
  const pattern = search ? `%${search.replace(/[\\%_]/g, "\\$&")}%`.replace(/\\/g, "\\\\").replace(/"/g, '\\"') : null;
  function query(fields: string, head = false) {
    const relation = `user1:users!vacations_id_user_fkey!inner(${fields.startsWith("id,id_user,") ? "id,name,email" : "id"})`;
    let q = supabase.from("vacations").select(`${fields},${relation}`, { count: head ? "exact" : undefined, head })
      .eq("user1.is_active", true).eq("user1.is_diplomatic", false).gte("days", 0);
    if (!admin) q = q.eq("id_user", user!.id);
    if (filters.from) q = q.gte("start", filters.from);
    if (filters.to) q = q.lte("start", filters.to);
    if (filters.status === "approved") q = q.eq("approve_request", true);
    if (filters.status === "pending") q = q.or("approve_request.eq.false,approve_request.is.null");
    if (pattern) q = q.or(`name.ilike."${pattern}",email.ilike."${pattern}"`, { referencedTable: "user1" });
    return q;
  }
  const failure = () => new Error("No se pudieron cargar las vacaciones");
  const today = vacationToday(now), month = vacationMonth(now);
  const [count, pending, active] = await Promise.all([
    query("id", true),
    query("id", true).or("approve_request.eq.false,approve_request.is.null"),
    query("id", true).eq("approve_request", true).lte("start", today).gte("finish", today),
  ]);
  for (const result of [count, pending, active]) if (result.error || result.count == null) throw failure();
  const total = count.count!;
  const pages = Math.max(1, Math.ceil(total / VACATION_PAGE_SIZE));
  const requested = Number.isSafeInteger(filters.page) && filters.page! > 0 ? filters.page! : 1;
  const page = Math.min(requested, pages);
  // Fetch only the month's days for the sum, in batches so PostgREST cannot silently truncate totals.
  let approvedDays = 0;
  for (let offset = 0; ; offset += 1000) {
    const result = await query("days").eq("approve_request", true).gte("start", month.start).lt("start", month.end)
      .order("id", { ascending: true }).range(offset, offset + 999);
    if (result.error || !result.data) throw failure();
    for (const row of result.data) approvedDays += Number((row as unknown as { days: number | null }).days ?? 0);
    if (result.data.length < 1000) break;
  }
  let rows: VacationRecord[] = [];
  if (total > 0) {
    const first = (page - 1) * VACATION_PAGE_SIZE;
    const result = await query("id,id_user,request_date,start,finish,days,approve_request")
      .order("request_date", { ascending: false, nullsFirst: false }).order("id", { ascending: false })
      .range(first, Math.min(total - 1, first + VACATION_PAGE_SIZE - 1));
    if (result.error || !result.data) throw failure();
    rows = result.data as unknown as VacationRecord[];
  }
  return { rows, total, page, pages, summary: { pending: pending.count!, active: active.count!, approvedDays, month: month.start.slice(0, 7) } };
}
