import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CTable from "../_components/compensatory-table";
import getsCompensatorioById from "@/actions/getCompensatorioById";
import { ApprovecHeader } from "./_components/approvec-header";
import { UserInfoCard } from "./_components/user-info-card";
import { ApprovalActions } from "./_components/approval-actions";

export default async function Approvec({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session === null) {
    redirect("/login");
  }

  const compensatory = await getsCompensatorioById(id);

  return (
    <div className="space-y-6 p-5">
      {/* Header con breadcrumbs y estado */}
      <ApprovecHeader compensatory={compensatory} />

      {/* Tabla de detalles */}
      <div className="rounded-md border bg-white">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Detalle del Compensatorio</h3>
          <CTable compensatory={compensatory} />
        </div>
      </div>

      {/* Grid con info de usuario y acciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserInfoCard compensatory={compensatory} />
        <ApprovalActions compensatory={compensatory} />
      </div>
    </div>
  );
}
