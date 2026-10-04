import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { requireCurrentUserAdminAndActive } from "@/lib/auth/admin-check";

import { VacationsWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic';

// Use React.cache for per-request deduplication (Vercel best practice)
export const getVacationsNoapproved = cache(async():Promise<VacationsWithUser[]> => {
    await requireCurrentUserAdminAndActive();
    const supabase = await createClient();
    const { data, error } = await supabase.from("vacations")
      .select("*,user1:users!vacations_id_user_fkey(id,name,email,num_vacations)")
      .or("approve_request.eq.false,approve_request.is.null")
      .is("cancelled_at", null)
      .order("request_date", { ascending: true });
    if (error || !data) throw new Error("No se pudieron cargar las vacaciones pendientes.");
    return data.map((row) => ({
      ...row, user_id: row.id_user, user_name: row.user1?.name ?? null,
      email: row.user1?.email ?? null, num_vacations: row.user1?.num_vacations ?? 0, users: [],
    }));
});

// Default export for compatibility
export default getVacationsNoapproved;
