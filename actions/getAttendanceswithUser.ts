import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { AttendancesWithUser } from "../types/collections";

export const dynamic = 'force-dynamic'

const getAttendanceswithUser = async() => {
    const supabase = createServerComponentClient({
      cookies: cookies
    });

    const { data, error } = await supabase
      .rpc('listar_horas_entrada_salida')
      .select('*')
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getAttendanceswithUser;