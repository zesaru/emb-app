import { createClient } from "@/utils/supabase/server";

import { VacationsWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getVacationsNoapproved = async():Promise<VacationsWithUser[]> => {
    const supabase = createClient();

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