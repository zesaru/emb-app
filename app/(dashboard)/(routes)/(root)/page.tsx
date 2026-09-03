import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DataTable } from "../../_components/data-table";
import { columns } from "../../_components/columns";
import { DataTableHour } from "../../_components/data-table-hour";
import { columnsHour } from "../../_components/columns-hour";
import { DataTableVacations } from "../../_components/data-table-vacaciones";
import { columnVacations } from "../../_components/columms-vacations";

import getsCompensatoriosNoApproved from "@/actions/getCompensatoriosNoApproved";
import getCompensatoriosHourNoapproved from "@/actions/getCompensatoriosHourNoapproved";
import getVacationsNoapproved from "@/actions/getVacationsNoApproved";
import getUsersById from "@/actions/getUsersById";
import { getAdminDashboardReport } from "@/actions/get-admin-dashboard-report";
import { DashboardReportView } from "../report/_components/dashboard-report";
import Usertabs from "../../_components/usertabs";
export const dynamic = "force-dynamic";

export default async function Index() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Parallel data fetching to eliminate waterfalls (Vercel best practice)
  const [
    userData,
    compensatorysnoapproved,
    compensatorysHournoapproved,
    vacationsnoapproved
  ] = await Promise.all([
    getUsersById(user.id),
    getsCompensatoriosNoApproved(),
    getCompensatoriosHourNoapproved(),
    getVacationsNoapproved()
  ]);

  const currentUserProfile = userData?.[0] ?? {
    id: user.id,
    email: user.email ?? "",
    name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Usuario",
    role: "user",
    admin: null,
    num_vacations: 0,
    num_compensatorys: 0,
  };
  const dashboardReport = currentUserProfile.admin === "admin"
    ? await getAdminDashboardReport()
    : null;

  return (
    <div className="w-full flex flex-col items-center">
      {currentUserProfile?.admin === "admin" ? (
        <div className="w-full space-y-8 bg-slate-50 px-4 py-6 md:px-6 lg:px-8">
          <DashboardReportView report={dashboardReport!} showDetailedReports={false} showHeader={false} showOverview={false} />
          <div className="hidden h-full flex-1 flex-col pl-4 pt-6 md:flex">
            <div className="flex items-center justify-between">
              <h2 className="text-m font-bold tracking-tight">
                Aprobar solicitudes de compensatorios
              </h2>
            </div>
            <DataTable columns={columns} data={compensatorysnoapproved} />
          </div>

          <div className="hidden h-full flex-1 flex-col pl-4 pt-6 md:flex">
            <div className="flex items-center justify-between">
              <h2 className="text-m font-bold tracking-tight">
                Aprobar descansos por compensatorios
              </h2>
            </div>
            <DataTableHour
              columns={columnsHour}
              data={compensatorysHournoapproved}
            />
          </div>

          <div className="hidden h-full flex-1 flex-col pl-4 pt-6 md:flex">
            <div className="flex items-center justify-between">
              <h2 className="text-m font-bold tracking-tight">
                Aprobar solicitudes de vacaciones
              </h2>
            </div>
            <DataTableVacations
              columns={columnVacations}
              data={vacationsnoapproved}
            />
          </div>
        </div>
      ) : (
        <>
          <Usertabs user={currentUserProfile} />
        </>
      )}
    </div>
  );
}
