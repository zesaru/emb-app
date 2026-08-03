import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";
import List from '../../_components/list'
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/admin-check";

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

  return (
    <div className="min-h-screen bg-surface px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <List />
      </div>
    </div>
  )
}

export default Report
