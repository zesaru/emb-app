import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import getVacationswithUser from "@/actions/getVacationswithUser";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Calendar from "./_components/calendar";

export const dynamic = "force-dynamic";

export default async function Compensatorios() {

  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  const vacations = await getVacationswithUser();

  return (
    <>
      <div className="flex flex-col">
        <div className="container mx-auto py-10">
          <Calendar data={vacations} />
        </div>
      </div>
    </>
  );
}