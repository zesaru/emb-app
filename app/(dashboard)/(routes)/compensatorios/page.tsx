import { DataTable } from "./_components/data-table"
import { columns } from "./_components/columns"
import getsCompensatorioswithUser from "@/actions/getCompensatorioswithUser";

export default async function Compensatorios() {
  const compensatorys = await getsCompensatorioswithUser();

  return (
    <div className="flex flex-col">
      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={compensatorys} />
      </div>
    </div>
  )
}

