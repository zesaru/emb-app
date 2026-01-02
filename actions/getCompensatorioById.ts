import { createClient } from "@/utils/supabase/server";

import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getsCompensatorioById = async(id:string):Promise<CompensatorysWithUser[]> => {
    const supabase = createClient();

    // Verificar autenticación - CRÍTICO PARA SEGURIDAD
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    const { data, error } = await supabase
      .from('compensatorys')
      .select('*, user1:users!user_id(*)')
      .eq('id', id);

    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getsCompensatorioById;