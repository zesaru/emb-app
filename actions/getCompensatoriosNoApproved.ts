import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getsCompensatoriosNoApproved = async():Promise<CompensatorysWithUser[]> => {
    const cookieStore = await cookies()
    
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
    )
   
    const { data } = await supabase.rpc("list_unapproved_compensatorys");

    return (data as any) || [];
}

export default getsCompensatoriosNoApproved;