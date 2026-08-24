import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/admin-check";
import { getAdminDashboardReport } from "@/actions/get-admin-dashboard-report";
import { DashboardReportView } from "./_components/dashboard-report";

const Report = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!(await isAdmin(user.id))) {
    redirect("/");
  }

  const report = await getAdminDashboardReport();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardReportView report={report} />
    </div>
  )
}

export default Report
