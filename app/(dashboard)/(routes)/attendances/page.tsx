import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { DataTable } from "./_components/data-table"
import { columns } from "./_components/columns"
import getAttendanceswithUser from "@/actions/getAttendanceswithUser";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import getUsersById from "@/actions/getUsersById";

export const dynamic = "force-dynamic";

export default async function Attendances() {

  const supabase = createServerComponentClient<Database>({ cookies });

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

