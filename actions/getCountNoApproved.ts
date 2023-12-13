import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const getCountNoApproved = async () => {
  const supabase = createServerComponentClient<Database>({
    cookies: cookies,
  });

  const  { data }  = await supabase.rpc("listar_vacaciones_compensatorios_no_aprobados_por_usuario");
  return (data as any) || [];
};

export default getCountNoApproved;
