import { createClient } from "@/utils/supabase/server";
import { getRequestUser } from "@/lib/auth/request-user";
import { isAdmin, requireUserActive } from "@/lib/auth/admin-check";
import { canViewAllCompensatorys } from "@/lib/auth/compensatory-permissions";
import type { CompensatoryFilters } from "@/actions/getCompensatorioswithUser";
import { parseCompensatoryMonth } from "@/lib/compensatorios/filters";
import type { CompensatorysWithUser } from "@/types/collections";

export const COMPENSATORY_PAGE_SIZE = 25;

type Filters = CompensatoryFilters & { page?: number; sort?: "asc" | "desc" };

export async function listCompensatoryRecords(filters: Filters = {}, report = false) {
  const { data: { user }, error: authError } = await getRequestUser();
  if (authError || !user) throw new Error("No autenticado");
  await requireUserActive(user.id);
  const canViewAll = await isAdmin(user.id) || await canViewAllCompensatorys(user.id);
  const supabase = await createClient();
  const search = filters.user?.trim();
  // Quote the PostgREST value and escape wildcard characters to preserve literal substring search.
  const pattern = search ? `%${search.replace(/[\\%_]/g, "\\$&")}%`.replace(/\\/g, "\\\\").replace(/"/g, '\\"') : null;
  const month = parseCompensatoryMonth(filters.month);
  if (report && !month) throw new Error("Selecciona un mes válido para el reporte");
  const from = filters.from || (month ? `${month}-01` : undefined);
  const to = filters.to || (month ? new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).toISOString().slice(0,10) : undefined);
  const ascending = filters.sort === "asc";
  function query(head = false) {
    let q = supabase.from("compensatorys")
      .select(`*, user1:users!compensatorys_user_id_fkey${search ? "!inner" : ""}(id,name,email)`, { count: head ? "exact" : undefined, head })
      .gte("hours", 0);
    if (!canViewAll) q = q.eq("user_id", user!.id);
    if (from) q = q.gte("event_date", from);
    if (to) q = q.lte("event_date", to);
    if (filters.status === "approved") q = q.eq("approve_request", true);
    if (filters.status === "pending") q = q.eq("approve_request", false);
    if (pattern) q = q.or(`name.ilike."${pattern}",email.ilike."${pattern}"`, { referencedTable: "user1" });
    return q.order("event_date", { ascending }).order("id", { ascending });
  }
  const countResult = await query(true);
  if (countResult.error || countResult.count == null) throw new Error("No se pudieron cargar los compensatorios");
  const total = countResult.count;
  const pages = Math.max(1, Math.ceil(total / COMPENSATORY_PAGE_SIZE));
  const requested = Number.isSafeInteger(filters.page) && filters.page! > 0 ? filters.page! : 1;
  const page = Math.min(requested, pages);
  const rows: CompensatorysWithUser[] = [];
  if (total > 0) {
    const first = report ? 0 : (page - 1) * COMPENSATORY_PAGE_SIZE;
    const end = report ? total : Math.min(total, first + COMPENSATORY_PAGE_SIZE);
    const batchSize = report ? 1000 : COMPENSATORY_PAGE_SIZE;
    for (let offset = first; offset < end; offset += batchSize) {
      const result = await query().range(offset, Math.min(end - 1, offset + batchSize - 1));
      if (result.error) throw new Error("No se pudieron cargar los compensatorios");
      rows.push(...((result.data ?? []) as unknown as CompensatorysWithUser[]));
    }
  }
  return { rows, total, page, pages };
}
