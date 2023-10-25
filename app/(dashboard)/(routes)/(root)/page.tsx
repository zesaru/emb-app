import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { DataTable } from '../../_components/data-table'
import { columns } from "../../_components/columns";
import { DataTableHour } from '../../_components/data-table-hour'
import { columnsHour } from '../../_components/columns-hour';
import { DataTableVacations } from '../../_components/data-table-vacaciones'
import { columnVacations } from '../../_components/columms-vacations';

import getsCompensatoriosNoApproved from "@/actions/getCompensatoriosNoApproved";
import GetNotApproved from "@/actions/getNotApproved";
import getCompensatoriosHourNoapproved from "@/actions/getCompensatoriosHourNoapproved";
import getVacationsNoapproved from "@/actions/getVacationsNoApproved";
import getUsersById from "@/actions/getUsersById";

export const dynamic = "force-dynamic";

export default async function Index() {
  
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session === null) {
    redirect("/login");
  }

  const user = await getUsersById(session.user.id);  
  
  const compensatorysnoapproved = await getsCompensatoriosNoApproved();
  const compensatorysHournoapproved = await getCompensatoriosHourNoapproved();
  const vacationsnoapproved = await getVacationsNoapproved();

  const notApproved = await GetNotApproved();
  

  return (
    <div className="w-full flex flex-col items-center">

      { user[0].admin==='admin' ?
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
                <div className="text-2xl font-bold">{notApproved[0].unapproved_count}</div>
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
                <div className="text-2xl font-bold">{notApproved[0].final_approve_request_count}</div>
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
            <h2 className="text-m font-bold tracking-tight">Aprobar registros de compensatorios</h2>
        </div>
        <DataTable columns={columns} data={compensatorysnoapproved} />
      </div>

      <div className="hidden h-full flex-1 flex-col pl-4 pt-6 md:flex">
        <div className="flex items-center justify-between">
            <h2 className="text-m font-bold tracking-tight">Aprobar horas de descanso por compensatorios</h2>
        </div>
        <DataTableHour columns={columnsHour} data={compensatorysHournoapproved} />
      </div>

      <div className="hidden h-full flex-1 flex-col pl-4 pt-6 md:flex">
        <div className="flex items-center justify-between">
            <h2 className="text-m font-bold tracking-tight">Vacaciones</h2>
        </div>
        <DataTableVacations columns={columnVacations} data={vacationsnoapproved} />
      </div>

    </div>
    : 
    <>
<div className="bg-slate-100  mt-[77px]  py-3 px-3">
  <section className="relative overflow-hidden">
    <div className="container">
      <div className="flex">
        <div className="w-full">
          <h3 className="text-xl text-gray-800 mt-2">{user[0].name}</h3>
          <p className="mt-1 font-medium mb-4">Welcome!</p>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6 mt-2">
        {/* profile widget star */}
        <div className="lg:col-span-5 col-span-12">
          <div className="bg-white rounded">
            <div className="p-6">
              <div className="flex">
                <div className="grow">
                  <div className="flex">
                    {/* <img src="assets/images/avatars/img-8.jpg" className="img-fluid w-12 h-12 rounded me-3" alt="..." /> */}
                    <div className="grow">
                      <h4 className="tetx-lg text-gray-800 mb-1 mt-0 font-semibold">{user[0].name}</h4>
                      <p className="text-gray-400 pb-0 text-sm mb-4 font-medium">{user[0].role}</p>
                    </div>
                  </div>
                </div>

              </div>
              <div className="flex gap-4 flex-wrap py-4 border-b">
                <div className="mb-2">
                  <a href="#" className="flex gap-0.5 text-gray-400 text-sm"><svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>{user[0].email}</a>
                </div>
                <div className="mb-2">
                  <a href="#" className="flex gap-0.5 text-gray-400 text-sm"><svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>Anexo 2xx</a>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4">
                <div className="md:w-1/2 w-full">
                  <div className="flex justify-between mb-3">
                    <h6 className="fw-medium my-0">Vacaciones</h6>
                    <p className="float-end mb-0">15%</p>
                  </div>
                  <div className="flex w-full h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700 ">
                    <div className="flex flex-col justify-center overflow-hidden bg-primary" role="progressbar" style={{width: '15%'}} aria-valuenow={25} aria-valuemin={0} aria-valuemax={100} />
                  </div>
                </div>
                <div className="md:w-1/2 w-full">
                  <div className="flex justify-between mb-3">
                    <h6 className="fw-medium my-0">Compensatorios</h6>
                    <p className="float-end mb-0">7.5</p>
                  </div>
                  <div className="flex w-full h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700 ">
                    <div className="flex flex-col justify-center overflow-hidden bg-orange-500" role="progressbar" style={{width: '85%'}} aria-valuenow={25} aria-valuemin={0} aria-valuemax={100} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* profile widget end */}
        <div className="lg:col-span-3 col-span-12 space-y-6">
          <div className="bg-white">
            <div className="flex items-center p-6">
              <div className=''>
                <div className="inline-flex items-center justify-center h-12 w-12 bg-green-500/10 rounded me-3">
                  <svg className="text-green-500" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
              </div>
              <div className="flex-grow-1">
                <h3 className="text-xl text-gray-800">{user[0].num_vacations}</h3>
                <p className="mb-0">Vacaciones</p>
              </div>
            </div>
          </div>
          <div className="bg-white">
            <div className="flex items-center p-6">
              <div className=''>
                <div className="inline-flex items-center justify-center h-12 w-12 bg-sky-500/10 rounded me-3">
                  <svg className="text-sky-500" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </div>
              </div>
              <div className="grow">
                <h3 className="text-xl text-gray-800">21</h3>
                <p className="mb-0">Compensatorios</p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 col-span-12">
          <div className="bg-white">
            <div className="p-6">
              <div className="flex justify-between">
                <div className="grow">
                  <h4 className="text-base font-semibold text-gray-800">Tardanzas</h4>
                </div>

              </div>
              <h1 className="text-3xl text-gray-800 my-2.5">xxxxx</h1>
              <p className="text-gray-400 text-sm">Ultimo mes</p>
              <hr className="my-3.5" />
              {/* <div className="flex items-center">
                <div className="lg:w-1/2">
                  <div className="flex items-center">
                    <div className="me-4 shrink">
                      <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                    </div>
                    <div className="grow">
                      <h5 className="mt-0 mb-0">15%</h5>
                      <p className="text-muted mb-0 fs-13">Prev Week</p>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <div className="flex items-center">
                    <div className="me-3 flex-shrink-0">
                      <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="mt-0 mb-0">10%</h5>
                      <p className="text-muted mb-0 fs-13">Prev Month</p>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>{/* end grid */}
    </div>
  </section>

</div>

    </>
    }
  </div>
  );
}
