import { createClient } from "@/utils/supabase/server";
import type { CompensatoryMovement } from "@/lib/compensatorios/history";

export default async function getCompensatoriosById(id: string): Promise<CompensatoryMovement[]> {
  const supabase = await createClient();
  const movements: CompensatoryMovement[] = [];
  const batchSize = 1000;
  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await supabase
      .from("compensatorys")
      .select("id,user_id,event_date,compensated_hours_day,event_name,hours,compensated_hours,approve_request,final_approve_request,cancelled_at,t_time_start")
      .eq("user_id", id)
      .order("id")
      .range(offset, offset + batchSize - 1);

    if (error || !data) throw new Error("No se pudo cargar el historial de compensatorios.");
    movements.push(...data);
    if (data.length < batchSize) return movements;
  }
}
