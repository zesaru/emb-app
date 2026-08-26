import { createClient } from "@/utils/supabase/server";
import { DataTable } from "./_components/data-table"
import { columns } from "./_components/columns"
import getVacationswithUser from "@/actions/getVacationswithUser";
import { redirect } from "next/navigation";
import { Clock, CalendarCheck, Users } from 'lucide-react';
import { isAdmin } from "@/lib/auth/admin-check";

export const dynamic = "force-dynamic";

export default async function Vacaciones() {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = await isAdmin(user.id);
  const allVacations = await getVacationswithUser();
  const vacations = admin
    ? allVacations
    : allVacations.filter((v) => v.id_user === user.id);

  // Calcular estadísticas para admin
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalPendientes = vacations.filter(v => !v.approve_request).length;

  const totalDiasAprobadosMes = vacations
    .filter(v => {
      if (!v.approve_request || !v.start) return false;
      const startDate = new Date(v.start);
      return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
    })
    .reduce((sum, v) => sum + Number(v.days || 0), 0);

  const vacacionesActivas = vacations.filter(v => {
    if (!v.approve_request || !v.start || !v.finish) return false;
    const startDate = new Date(v.start);
    const finishDate = new Date(v.finish);
    return now >= startDate && now <= finishDate;
  }).length;

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Gestión de vacaciones</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Personal administrativo activo</h1>
            <p className="mt-1 text-sm text-slate-600">Solo se incluyen colaboradores activos no diplomáticos.</p>
          </div>
          <p className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">{vacations.length} solicitudes visibles</p>
        </div>
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Solicitudes Pendientes */}
          <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-gray-100">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 bg-amber-50 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Solicitudes Pendientes</p>
              <p className="text-2xl font-bold text-amber-600">{totalPendientes}</p>
            </div>
          </div>

          {/* Días Aprobados este Mes */}
          <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-gray-100">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                <CalendarCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Días Aprobados (Mes)</p>
              <p className="text-2xl font-bold text-green-600">{totalDiasAprobadosMes} <span className="text-base font-normal text-gray-500">días</span></p>
            </div>
          </div>

          {/* Vacaciones Activas */}
          <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-gray-100">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Vacaciones Activas</p>
              <p className="text-2xl font-bold text-blue-600">{vacacionesActivas}</p>
            </div>
          </div>
        </div>

        {/* Tabla de registros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <DataTable columns={columns} data={vacations} />
        </div>
      </div>
    </div>
  )
}
