import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { DataTable } from "./_components/data-table"
import { columns } from "./_components/columns"
import getVacationswithUser from "@/actions/getVacationswithUser";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Database } from "@/types/database.type";

export const dynamic = "force-dynamic";

export default async function Compensatorios() {

  const supabase = createServerComponentClient<Database>({ cookies: await cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  const vacations = await getVacationswithUser();

  return (
    <div className="flex flex-col">
      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={vacations} />
      </div>
    </div>
  )
}

