import { createClient } from "@/utils/supabase/server";
import { cache } from "react";

import { VacationsWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

// Use React.cache for per-request deduplication (Vercel best practice)
export const getVacationsNoapproved = cache(async():Promise<VacationsWithUser[]> => {
    const supabase = await createClient();

    // Verificar autenticación - CRÍTICO PARA SEGURIDAD
    // Solo admins deberían ver la cola de aprobación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    const { data } = await supabase.rpc("list_unapproved_vacations");
    return (data as any) || [];
}

export default getVacationsNoapproved;