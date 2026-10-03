import { createClient } from "@/utils/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/auth/request-user";
import { requireUserActive } from "@/lib/auth/admin-check";
import { buildCalendarEvents, type CalendarRange, type CalendarVacation, type CalendarCompensatory } from "@/lib/calendar/events";

export class CalendarAccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function getCalendarEvents(range: CalendarRange) {
  const { data: { user }, error } = await getRequestUser();
  if (error || !user) throw new CalendarAccessError(401, "Debes iniciar sesión");
  try {
    await requireUserActive(user.id);
  } catch (error) {
    if (error instanceof Error && error.message === "Usuario inactivo") {
      throw new CalendarAccessError(403, "No tienes acceso al calendario");
    }
    throw error;
  }
  const supabase = await createClient();
  // Preserve the existing team-calendar projection, never expose full privileged rows.
  const admin = getSupabaseAdminClient();
  async function vacations() {
    const rows: CalendarVacation[] = [];
    for (let offset = 0; ; offset += 1000) {
      const result = await supabase.from("vacations")
        .select("id,start,finish,user1:users!vacations_id_user_fkey!inner(name)")
        .eq("user1.is_active", true).eq("user1.is_diplomatic", false).gte("days", 0)
        .lt("start", `${range.end}T00:00:00+09:00`).gte("finish", `${range.start}T00:00:00+09:00`)
        .order("id").range(offset, offset + 999);
      if (result.error) throw new Error("No se pudieron cargar las vacaciones del calendario");
      rows.push(...(result.data as unknown as CalendarVacation[]));
      if (result.data.length < 1000) return rows;
    }
  }
  async function compensatorys() {
    const rows: CalendarCompensatory[] = [];
    for (let offset = 0; ; offset += 1000) {
      const result = await admin.from("compensatorys")
        .select("id,event_date,event_name,compensated_hours,compensated_hours_day,t_time_start,t_time_finish,user1:users!compensatorys_user_id_fkey(name)")
        .gte("hours", 0)
        .or(`and(compensated_hours_day.gte.${range.start},compensated_hours_day.lt.${range.end}),and(event_date.gte.${range.start},event_date.lt.${range.end})`)
        .order("id").range(offset, offset + 999);
      if (result.error) throw new Error("No se pudieron cargar los compensatorios del calendario");
      rows.push(...result.data);
      if (result.data.length < 1000) return rows;
    }
  }
  const [vacationRows, compensatoryRows] = await Promise.all([vacations(), compensatorys()]);
  return buildCalendarEvents(vacationRows, compensatoryRows, range);
}
