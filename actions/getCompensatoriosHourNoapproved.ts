import { createClient } from "@/utils/supabase/server";

import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getCompensatoriosHourNoapproved = async():Promise<CompensatorysWithUser[]> => {
    const supabase = createClient();

    // Verificar autenticación - CRÍTICO PARA SEGURIDAD
    // Solo admins deberían ver la cola de aprobación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    const { data } = await supabase.rpc("list_hours_unapproved_compensatorys");
    return (data as any) || [];
}

export default getCompensatoriosHourNoapproved;