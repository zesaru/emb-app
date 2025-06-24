import { createServerClient } from "@supabase/ssr";
import { DataTable } from "./_components/data-table"
import { columns } from "./_components/columns"
import getAttendanceswithUser from "@/actions/getAttendanceswithUser";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import getUsersById from "@/actions/getUsersById";
import { Database } from "@/types/database.type";

export const dynamic = "force-dynamic";

export default async function Attendances() {

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  
  const userData = await getUsersById(user.id);  

  const attendances = await getAttendanceswithUser();

  return (
    <div className="flex flex-col">
      <div className="container mx-auto py-10">
      { userData[0].admin==='admin' ?
        <DataTable columns={columns} data={attendances} />
        : <p>Me pareció ver un lindo gatito</p>
      }
      </div>
    </div>
  )
}

