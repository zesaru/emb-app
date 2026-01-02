import { createClient } from "@/utils/supabase/server";

import { AttendancesWithUser } from "../types/collections";

export const dynamic = 'force-dynamic'

const getAttendanceswithUser = async() => {
    const supabase = await createClient();

    // Verificar autenticación - CRÍTICO PARA SEGURIDAD
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    const { data, error } = await supabase
      .rpc('listar_horas_entrada_salida');

    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getAttendanceswithUser;