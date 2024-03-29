import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { DataTable } from "./_components/data-table"
import { columns } from "./_components/columns"
import getsCompensatorioswithUser from "@/actions/getCompensatorioswithUser";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Compensatorios() {

  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session === null) {
    redirect("/login");
  }
  const compensatorys = await getsCompensatorioswithUser();

  return (
    <div className="flex flex-col">
      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={compensatorys} />
      </div>
    </div>
  )
}

