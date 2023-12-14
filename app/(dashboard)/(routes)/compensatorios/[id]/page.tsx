import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import getsCompensatorioswithUserById from "@/actions/getCompensatoriosbyId";
import getUsersById from "@/actions/getUsersById";

export const dynamic = "force-dynamic";

export default async function CompensatoriosbyId(
  { params }: { params: { id: string } },
) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session === null) {
    redirect("/login");
  }

  const compensatorys = await getsCompensatorioswithUserById(params.id);
  const user = await getUsersById(params.id);

  console.log(user);

  const sum = compensatorys.map((compensatory) => ({
    hours: compensatory.hours ?? 0, 
    approve_request: compensatory.approve_request ?? false, 
    compensated_hours: compensatory.compensated_hours ?? 0, 
  }));

  const totalHours = sum
    .map((event) => event.hours)
    .reduce((total, hours) => total + hours, 0);

  const totalHoursAproved = sum
    .filter((event) => event.approve_request)
    .map((event) => event.hours)
    .reduce((total, hours) => total + hours, 0);


  return (
    <div className="flex flex-col">
      <div className="container mx-auto py-10">
        <div className="grid grid-cols-12 gap-6 mt-2">
            <div className="bg-white lg:col-span-3 col-span-12 space-y-6">
              <div className="flex items-center p-6">
                <div className=''>
                  <div className="inline-flex items-center justify-center h-12 w-12 bg-sky-500/10 rounded me-3">
                    <svg className="text-sky-500" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                  </div>
                </div>
                <div className="grow">
                  <h3 className="text-xl text-gray-800">{totalHours} / hrs</h3>
                  <p className="mb-0  text-gray-800">Registros Solicitados</p>
                </div>
              </div>
            </div>

            <div className="bg-white lg:col-span-3 col-span-12 space-y-6">
              <div className="flex items-center p-6">
                <div className=''>
                  <div className="inline-flex items-center justify-center h-12 w-12 bg-green-500/10 rounded me-3">
                    <svg className="text-green-500" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h3 className="text-xl text-gray-800">{totalHoursAproved} / hrs</h3>
                  <p className="mb-0  text-gray-800">Registros Aprobados</p>
                </div>
              </div>
            </div>

            <div className="bg-white lg:col-span-3 col-span-12 space-y-6">
              <div className="flex items-center p-6">
                <div className=''>
                  <div className="inline-flex items-center justify-center h-12 w-12 bg-green-500/10 rounded me-3">
                  <svg className="text-sky-500" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h3 className="text-xl text-gray-800">{user[0].num_compensatorys}</h3>
                  <p className="mb-0  text-gray-800">Compensatorios restantes</p>
                </div>
              </div>
            </div>
          
        </div>
      </div>
      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={compensatorys} />
      </div>
    </div>
  );
}
