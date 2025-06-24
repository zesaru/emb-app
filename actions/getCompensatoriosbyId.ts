import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getsCompensatorioswithUserById = async(id:string):Promise<CompensatorysWithUser[]> => {
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

    
    const { data, error } = await supabase.rpc("get_compensatorys_for_user", {
      user_id: id,
    });
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getsCompensatorioswithUserById;