import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { User, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import getsCompensatorioswithUserById from "@/actions/getCompensatoriosbyId";
import getUsersById from "@/actions/getUsersById";

export const dynamic = "force-dynamic";

export default async function CompensatoriosbyId({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session === null) {
    redirect("/login");
  }

  const compensatorys = await getsCompensatorioswithUserById(id);
  const userId = compensatorys[0]?.user_id || id;
  const user = await getUsersById(userId);

  // Ordenar por fecha (más antiguo primero para el estado de cuenta)
  const sortedCompensatorys = compensatorys.sort((a, b) => {
    const dateA = a.event_date || a.compensated_hours_day || '';
    const dateB = b.event_date || b.compensated_hours_day || '';
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  // Calcular totales para las tarjetas de resumen
  const sum = sortedCompensatorys.map((compensatory) => ({
    hours: compensatory.hours ?? 0,
    compensated_hours: compensatory.compensated_hours ?? 0,
  }));

  // Total de entradas (horas ganadas)
  const totalEntradas = sum
    .map((event) => Number(event.hours))
    .reduce((total, hours) => total + hours, 0);

  // Total de salidas (horas usadas)
  const totalSalidas = sum
    .map((event) => Number(event.compensated_hours))
    .reduce((total, hours) => total + hours, 0);

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8 px-4">
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Entradas */}
          <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-gray-100">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Entradas</p>
              <p className="text-2xl font-bold text-green-600">+{totalEntradas} <span className="text-base font-normal text-gray-500">hrs</span></p>
            </div>
          </div>

          {/* Total Salidas */}
          <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-gray-100">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Salidas</p>
              <p className="text-2xl font-bold text-red-500">-{totalSalidas} <span className="text-base font-normal text-gray-500">hrs</span></p>
            </div>
          </div>

          {/* Saldo Actual */}
          <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-gray-100">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Saldo Actual</p>
              <p className="text-2xl font-bold text-gray-900">{user[0]?.num_compensatorys || "0"} <span className="text-base font-normal text-gray-500">hrs</span></p>
            </div>
          </div>
        </div>

        {/* Información del usuario */}
        <div className="flex items-center space-x-3 mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <p className="text-lg font-medium text-gray-900">{user[0]?.name || "Usuario"}</p>
        </div>

        {/* Tabla de registros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <DataTable columns={columns} data={sortedCompensatorys} />
        </div>
      </div>
    </div>
  );
}
