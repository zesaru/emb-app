import { getRequestUser, getRequestUserProfile } from "@/lib/auth/request-user";
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
import { getDashboardApprovalSummary } from "@/actions/get-dashboard-approval-summary";
import { ApprovalSummary } from "../../_components/approval-summary";
import Usertabs from "../../_components/usertabs";
export const dynamic = "force-dynamic";

export default async function Index() {
  const {
    data: { user },
    error: authError,
  } = await getRequestUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: currentUserProfile, error: profileError } = await getRequestUserProfile(user.id);
  if (profileError || !currentUserProfile) redirect("/login");

  const [compensatorysnoapproved, compensatorysHournoapproved, vacationsnoapproved, approvalSummary] =
    currentUserProfile.admin === "admin"
      ? await Promise.all([
          getsCompensatoriosNoApproved(),
          getCompensatoriosHourNoapproved(),
          getVacationsNoapproved(),
          getDashboardApprovalSummary(),
        ])
      : [[], [], [], null];

  return (
    <div className="w-full flex flex-col items-center">
      {currentUserProfile?.admin === "admin" ? (
        <div className="w-full space-y-8 bg-slate-50 px-4 py-6 md:px-6 lg:px-8">
          <ApprovalSummary summary={approvalSummary!} />
          {compensatorysnoapproved.length > 0 && (
            <div className="hidden h-full flex-1 flex-col pl-4 pt-6 md:flex">
              <div className="flex items-center justify-between">
                <h2 className="text-m font-bold tracking-tight">
                  Aprobar solicitudes de compensatorios
                </h2>
              </div>
              <DataTable columns={columns} data={compensatorysnoapproved} />
            </div>
          )}

          {compensatorysHournoapproved.length > 0 && (
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
          )}

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
