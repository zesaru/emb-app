import { createClient } from "@/utils/supabase/server";
import { DataTable } from "./_components/data-table"
import { columns } from "./_components/columns"
import getAttendanceswithUser from "@/actions/getAttendanceswithUser";
import { redirect } from "next/navigation";
import getUsersById from "@/actions/getUsersById";

export const dynamic = "force-dynamic";

export default async function Attendances() {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Parallel data fetching to eliminate waterfalls (Vercel best practice)
  const [userData, attendances] = await Promise.all([
    getUsersById(user.id),
    getAttendanceswithUser()
  ]);

  return (
    <div className="flex flex-col">
      <div className="container mx-auto py-10">
      { userData[0]?.admin==='admin' ?
        <DataTable columns={columns} data={attendances} />
        : <p>Me pareció ver un lindo gatito</p>
      }
      </div>
    </div>
  )
}

