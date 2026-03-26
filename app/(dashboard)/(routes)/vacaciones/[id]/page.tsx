import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { User, CalendarDays, CheckCircle, Umbrella } from "lucide-react";

import getUserVacationGrantSummary from "@/actions/getUserVacationGrantSummary";
import getUsersById from "@/actions/getUsersById";
import getVacationswithUserById from "@/actions/getVacationswithUserById";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

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
  const grantSummary = await getUserVacationGrantSummary(userId);

  const sortedVacations = vacations.sort((a, b) => {
    const dateA = a.request_date || "";
    const dateB = b.request_date || "";
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const sum = sortedVacations.map((vacation) => ({
    days: vacation.days ?? 0,
    approve_request: vacation.approve_request ?? false,
  }));

  const totalSolicitado = sum
    .map((event) => Number(event.days))
    .reduce((total, days) => total + days, 0);

  const totalAprobado = sum
    .filter((event) => event.approve_request)
    .map((event) => Number(event.days))
    .reduce((total, days) => total + days, 0);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
          <div className="flex items-center rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mr-4 flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
                <CalendarDays className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Solicitado</p>
              <p className="text-2xl font-bold text-purple-600">
                {totalSolicitado} <span className="text-base font-normal text-gray-500">días</span>
              </p>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mr-4 flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Aprobado</p>
              <p className="text-2xl font-bold text-green-600">
                {totalAprobado} <span className="text-base font-normal text-gray-500">días</span>
              </p>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mr-4 flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Umbrella className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Saldo Legacy</p>
              <p className="text-2xl font-bold text-gray-900">
                {userDetails[0]?.num_vacations || "0"} <span className="text-base font-normal text-gray-500">días</span>
              </p>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mr-4 flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <Umbrella className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Saldo por Grants</p>
              <p className="text-2xl font-bold text-amber-600">
                {grantSummary?.totalRemaining ?? 0} <span className="text-base font-normal text-gray-500">días</span>
              </p>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mr-4 flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50">
                <CalendarDays className="h-6 w-6 text-sky-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Próximo Grant</p>
              <p className="text-lg font-bold text-gray-900">{grantSummary?.nextExpectedGrantDate || "-"}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center space-x-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <p className="text-lg font-medium text-gray-900">{userDetails[0]?.name || "Usuario"}</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
          <DataTable columns={columns} data={sortedVacations} />
        </div>
      </div>
    </div>
  );
}
