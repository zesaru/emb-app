import { createClient } from "@/utils/supabase/server";
import getVacationswithUser from "@/actions/getVacationswithUser";
import getsCompensatorioswithUser from "@/actions/getCompensatorioswithUser";
import { redirect } from "next/navigation";
import Calendar from "./_components/calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vercel best practice: Parallel data fetching to eliminate waterfalls
  const [vacations, compensatorys] = await Promise.all([
    getVacationswithUser(),
    getsCompensatorioswithUser()
  ]);

  return (
    <>
      <div className="flex flex-col">
        <div className="container mx-auto py-10">
          <Calendar vacations={vacations} compensatorys={compensatorys} />
        </div>
      </div>
    </>
  );
}