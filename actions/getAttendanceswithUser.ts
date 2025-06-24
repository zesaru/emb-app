import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AttendancesWithUser } from "../types/collections";

export const dynamic = 'force-dynamic'

const getAttendanceswithUser = async() => {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    );

    const { data, error } = await supabase
      .rpc('listar_horas_entrada_salida')
      .select('*')
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getAttendanceswithUser;