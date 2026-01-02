import { createClient } from "@/utils/supabase/server";
import { DataTable } from "./_components/data-table"
import { columns } from "./_components/columns"
import getVacationswithUser from "@/actions/getVacationswithUser";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Compensatorios() {

  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session === null) {
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

