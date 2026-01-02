import { createClient } from "@/utils/supabase/server";

import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getsCompensatoriosNoApproved = async():Promise<CompensatorysWithUser[]> => {
    const supabase = await createClient();

    // Verificar autenticación - CRÍTICO PARA SEGURIDAD
    // Solo admins deberían ver la cola de aprobación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    const { data } = await supabase.rpc("list_unapproved_compensatorys");

    return (data as any) || [];
}

export default getsCompensatoriosNoApproved;