import { needsInvitationPassword } from "@/lib/auth/invitation-password";
import Navbar from "./_components/navbar";
import Sidebar from "./_components/sidebar";
import { redirect } from "next/navigation";
import { requireUserActive } from "@/lib/auth/admin-check";
import { getRequestUser, getRequestUserProfile } from "@/lib/auth/request-user";

export const dynamic = "force-dynamic";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const { data: { user }, error: authError } = await getRequestUser();
  if (authError || !user) redirect("/login");
  try {
    await requireUserActive(user.id);
  } catch {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await getRequestUserProfile(user.id);
  if (profileError || !profile) redirect("/login");
  if (needsInvitationPassword(profile)) redirect("/welcome");

  const navigation = { isAdmin: profile.admin === "admin", isSuperAdmin: profile.role === "super_admin" };

  return (
    <div className="h-full">
      <div className="h-[80px] md:pl-56 fixed inset-y-0 w-full z-50">
        <Navbar userName={profile.name || "Usuario"} {...navigation} />
      </div>
      <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-50">
        <Sidebar {...navigation} />
      </div>
      <main className="md:pl-56 pt-[80px] h-full">{children}</main>
    </div>
  );
};

export default DashboardLayout;
