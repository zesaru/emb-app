import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic';

// Use React.cache for per-request deduplication (Vercel best practice)
export const getCompensatoriosHourNoapproved = cache(async():Promise<CompensatorysWithUser[]> => {
    const supabase = await createClient();

    // Verificar autenticación - CRÍTICO PARA SEGURIDAD
    // Solo admins deberían ver la cola de aprobación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    const { data } = await supabase.rpc("list_hours_unapproved_compensatorys");
    return (data as any) || [];
});

// Default export for compatibility
export default getCompensatoriosHourNoapproved;