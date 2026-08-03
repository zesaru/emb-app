import { createClient } from "@/utils/supabase/server";
import { DataTable } from "./_components/data-table"
import { columns } from "./_components/columns"
import getsCompensatorioswithUser from "@/actions/getCompensatorioswithUser";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/admin-check";

export const dynamic = "force-dynamic";

export default async function Compensatorios() {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  const admin = await isAdmin(user.id);
  const allCompensatorys = await getsCompensatorioswithUser();
  const compensatorys = admin
    ? allCompensatorys
    : allCompensatorys.filter((c) => c.user_id === user.id);

  return (
    <div className="flex flex-col">
      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={compensatorys} />
      </div>
    </div>
  )
}

