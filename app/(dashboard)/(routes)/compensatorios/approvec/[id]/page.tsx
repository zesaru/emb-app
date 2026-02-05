import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CTable from "../_components/compensatory-table";
import getsCompensatorioById from "@/actions/getCompensatorioById";

export default async function Approvec({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const compensatory = await getsCompensatorioById(id);

  return (
    <div className="space-y-6 p-5">
      {/* Header con breadcrumbs y estado */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Compensatorios / Detalle
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          compensatory?.[0]?.final_approve_request === "true" || compensatory?.[0]?.approve_request === "true"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-700"
        }`}>
          {compensatory?.[0]?.final_approve_request === "true" || compensatory?.[0]?.approve_request === "true"
            ? "Aprobado"
            : "Pendiente"}
        </div>
      </div>

      {/* Tabla de detalles */}
      <div className="rounded-md border bg-white">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Detalle del Compensatorio</h3>
          <CTable compensatory={compensatory} />
        </div>
      </div>

      {/* Información del usuario */}
      {compensatory?.[0]?.user1 && (
        <div className="rounded-md border bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Información del Solicitante</h3>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center">
              <span className="text-sky-600 font-semibold">
                {compensatory[0].user1.name?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <p className="font-medium">{compensatory[0].user1.name || "Usuario"}</p>
              <p className="text-sm text-gray-500">{compensatory[0].user1.email || ""}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
