import { createClient } from "@/utils/supabase/server";
import { requireCurrentUserAdminAndActive } from "@/lib/auth/admin-check";

export type DashboardApprovalSummary = {
  pendingCompensatoryRequests: number;
  pendingCompensatoryRests: number;
  pendingVacations: number;
};

export async function getDashboardApprovalSummary(): Promise<DashboardApprovalSummary> {
  await requireCurrentUserAdminAndActive();
  const supabase = await createClient();
  const results = await Promise.all([
    supabase.from("compensatorys").select("id", { count: "exact", head: true })
      .not("event_name", "is", null).is("approve_request", null).is("cancelled_at", null),
    supabase.from("compensatorys").select("id", { count: "exact", head: true })
      .is("event_name", null).is("final_approve_request", null).is("cancelled_at", null),
    supabase.from("vacations").select("id", { count: "exact", head: true })
      .or("approve_request.is.null,approve_request.eq.false").is("cancelled_at", null),
  ]);
  if (results.some((result) => result.error || result.count == null)) {
    throw new Error("No se pudieron cargar las aprobaciones del inicio.");
  }
  return {
    pendingCompensatoryRequests: results[0].count!,
    pendingCompensatoryRests: results[1].count!,
    pendingVacations: results[2].count!,
  };
}
