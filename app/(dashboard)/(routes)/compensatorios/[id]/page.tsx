import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import getsCompensatorioswithUserById from "@/actions/getCompensatoriosbyId";

export const dynamic = "force-dynamic";

export default async function CompensatoriosbyId({ params }: { params: { id: string } } ) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session === null) {
    redirect("/login");
  }

  console.log(params.id);

  const compensatorys = await getsCompensatorioswithUserById(params.id);

  const sum = compensatorys.map((compensatory) => ({
    hours: compensatory.hours ?? 0, // Add null check here
    approve_request: compensatory.approve_request ?? false, // Add null check here'
    compensated_hours: compensatory.compensated_hours ?? 0, // Add null check here

  }));

  const totalHours = sum
    .map((event) => event.hours)
    .reduce((total, hours) => total + hours, 0);

  const totalHoursAproved = sum
    .filter((event) => event.approve_request)
    .map((event) => event.hours)
    .reduce((total, hours) => total + hours, 0);

  const totalHoursPending = sum
    .filter((event) => !event.approve_request)
    .map((event) => event.hours)
    .reduce((total, hours) => total + hours, 0);

    const totalHoursTaked = sum
    .map((event) => event.compensated_hours)
    .reduce((total, compensated_hours) => total + compensated_hours, 0);

    const finla = totalHours - totalHoursTaked;

  return (
    <div className="flex flex-col">
      <div>
        <ul>
          <li>Número de Horas compensatorios solicitados {totalHours}</li>
          <li>Número de horas compensatorios aprobados {totalHoursAproved}</li>
          <li>Número de Compensatorios Pendientes de aprobación {totalHoursPending}</li>
          <li>Número de Compensatorios Tomados {totalHoursTaked}</li>
          <li>Les resta {finla}</li>
        </ul>
      </div>
      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={compensatorys} />
      </div>
    </div>
  );
}
