import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Calendar-only projection. The service-role client is used on the server so
 * normal users can see the team calendar without exposing the full
 * compensatorys table through the Data API/RLS.
 */
export default async function getCalendarCompensatorios() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return [];

  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("compensatorys")
    .select("id, user_id, event_date, event_name, compensated_hours, compensated_hours_day, t_time_start, t_time_finish, user1:users!compensatorys_user_id_fkey(name)")
    .gte("hours", 0)
    .order("event_date", { ascending: false });

  if (error) {
    console.error("getCalendarCompensatorios:", error.message);
    return [];
  }

  return data || [];
}
