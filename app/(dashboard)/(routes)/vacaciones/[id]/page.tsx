import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { User, CalendarDays, CheckCircle, Umbrella } from 'lucide-react';
import getVacationswithUserById from "@/actions/getVacationswithUserById";
import getUsersById from "@/actions/getUsersById";

export const dynamic = "force-dynamic";

export default async function VacacionesById({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const vacations = await getVacationswithUserById(id);
  const userId = vacations[0]?.id_user || id;
  const userDetails = await getUsersById(userId);

  // Ordenar por fecha de solicitud (más reciente primero)
  const sortedVacations = vacations.sort((a, b) => {
    const dateA = a.request_date || '';
    const dateB = b.request_date || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  // Calcular totales para las tarjetas de resumen
  const sum = sortedVacations.map((vacation) => ({
    days: vacation.days ?? 0,
    approve_request: vacation.approve_request ?? false,
  }));

  // Total de días solicitados
  const totalSolicitado = sum
    .map((event) => Number(event.days))
    .reduce((total, days) => total + days, 0);

  // Total de días aprobados
  const totalAprobado = sum
    .filter((event) => event.approve_request)
    .map((event) => Number(event.days))
    .reduce((total, days) => total + days, 0);

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8 px-4">
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Solicitado */}
          <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-gray-100">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Solicitado</p>
              <p className="text-2xl font-bold text-purple-600">{totalSolicitado} <span className="text-base font-normal text-gray-500">días</span></p>
            </div>
          </div>

          {/* Total Aprobado */}
          <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-gray-100">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Aprobado</p>
              <p className="text-2xl font-bold text-green-600">{totalAprobado} <span className="text-base font-normal text-gray-500">días</span></p>
            </div>
          </div>

          {/* Saldo Vacacional */}
          <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-gray-100">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Umbrella className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Saldo Vacacional</p>
              <p className="text-2xl font-bold text-gray-900">{userDetails[0]?.num_vacations || "0"} <span className="text-base font-normal text-gray-500">días</span></p>
            </div>
          </div>
        </div>

        {/* Información del usuario */}
        <div className="flex items-center space-x-3 mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <p className="text-lg font-medium text-gray-900">{userDetails[0]?.name || "Usuario"}</p>
        </div>

        {/* Tabla de registros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <DataTable columns={columns} data={sortedVacations} />
        </div>
      </div>
    </div>
  );
}
