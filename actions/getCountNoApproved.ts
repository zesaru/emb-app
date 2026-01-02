import { createClient } from "@/utils/supabase/server";


export const dynamic = "force-dynamic";

const getCountNoApproved = async () => {
  const supabase = await createClient();

  const  { data }  = await supabase.rpc("listar_vacaciones_compensatorios_no_aprobados_por_usuario");
  return (data as any) || [];
};

export default getCountNoApproved;
