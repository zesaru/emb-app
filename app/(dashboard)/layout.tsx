import { needsInvitationPassword } from "@/lib/auth/invitation-password";
import Navbar from "./_components/navbar";
import Sidebar from "./_components/sidebar";
import { redirect } from "next/navigation";
import { requireUserActive } from "@/lib/auth/admin-check";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  try {
    await requireUserActive(user.id);
  } catch {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase.from("users")
    .select("provisioning_mode, invitation_status").eq("id", user.id).single();
  if (profileError || !profile) redirect("/login");
  if (needsInvitationPassword(profile)) redirect("/welcome");

  return (
    <div className="h-full">
      <div className="h-[80px] md:pl-56 fixed inset-y-0 w-full z-50">
        <Navbar />
      </div>
      <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      <main className="md:pl-56 pt-[80px] h-full">{children}</main>
    </div>
  );
};

export default DashboardLayout;
