import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "../../_components/data-table";
import { columns } from "../../_components/columns";
import { DataTableHour } from "../../_components/data-table-hour";
import { columnsHour } from "../../_components/columns-hour";
import { DataTableVacations } from "../../_components/data-table-vacaciones";
import { columnVacations } from "../../_components/columms-vacations";

import getsCompensatoriosNoApproved from "@/actions/getCompensatoriosNoApproved";
import GetNotApproved from "@/actions/getNotApproved";
import getCompensatoriosHourNoapproved from "@/actions/getCompensatoriosHourNoapproved";
import getVacationsNoapproved from "@/actions/getVacationsNoApproved";
import getUsersById from "@/actions/getUsersById";
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
    vacationsnoapproved,
    notApproved
  ] = await Promise.all([
    getUsersById(user.id),
    getsCompensatoriosNoApproved(),
    getCompensatoriosHourNoapproved(),
    getVacationsNoapproved(),
    GetNotApproved()
  ]);

  return (
    <div className="w-full flex flex-col items-center">
      {userData[0]?.admin === "admin" ? (
        <div>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Registro de compensatorios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {notApproved[0].unapproved_count}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cantidad de solicitudes por aprobar
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Horas de ausencias por aprobar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {notApproved[0].final_approve_request_count}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cantidad de solicitudes por aprobar
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Vacaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">7</div>
                    <p className="text-xs text-muted-foreground">
                      Solicitidudes de vacaciones por aprobar
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tardanzas
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">4</div>
                    <p className="text-xs text-muted-foreground"></p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          <div className="hidden h-full flex-1 flex-col pl-4 pt-6 md:flex">
            <div className="flex items-center justify-between">
              <h2 className="text-m font-bold tracking-tight">
                Aprobar registros de compensatorios
              </h2>
            </div>
            <DataTable columns={columns} data={compensatorysnoapproved} />
          </div>

          <div className="hidden h-full flex-1 flex-col pl-4 pt-6 md:flex">
            <div className="flex items-center justify-between">
              <h2 className="text-m font-bold tracking-tight">
                Aprobar horas de descanso por compensatorios
              </h2>
            </div>
            <DataTableHour
              columns={columnsHour}
              data={compensatorysHournoapproved}
            />
          </div>

          <div className="hidden h-full flex-1 flex-col pl-4 pt-6 md:flex">
            <div className="flex items-center justify-between">
              <h2 className="text-m font-bold tracking-tight">Vacaciones</h2>
            </div>
            <DataTableVacations
              columns={columnVacations}
              data={vacationsnoapproved}
            />
          </div>
        </div>
      ) : (
        <>
          <Usertabs user={userData[0]} />
        </>
      )}
    </div>
  );
}
