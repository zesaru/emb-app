import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/admin-check";
import { getStaffReport } from "@/actions/get-staff-report";
import { StaffReportView } from "./_components/staff-report-view";

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

  const report = await getStaffReport();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <StaffReportView initialReport={report} />
    </div>
  );
};

export default Report;
