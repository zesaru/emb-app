import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import getsCompensatorioswithUserById from "@/actions/getCompensatoriosbyId";

export const dynamic = "force-dynamic";

interface SumCompensatorys {
  event_name: string;
  hours: number;
  approve_request: boolean;
}

export default async function CompensatoriosbyId() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session === null) {
    redirect("/login");
  }

  const compensatorys = await getsCompensatorioswithUserById();

  const sum: SumCompensatorys[] = compensatorys.map((compensatory) => ({
    event_name: compensatory.event_name,
    hours: compensatory.hours ?? 0, // Add null check here
    approve_request: compensatory.approve_request ?? false, // Add null check here
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

  return (
    <div className="flex flex-col">
      <div>
        <ul>
          <li>Número de Horas compensatorios solicitados {totalHours}</li>
          <li>Número de horas compensatorios aprobados {totalHoursAproved}</li>
          <li>Número de Compensatorios Pendientes {totalHoursPending}</li>
        </ul>
      </div>
      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={compensatorys} />
      </div>
    </div>
  );
}
