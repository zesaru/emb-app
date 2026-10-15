import { redirect } from "next/navigation";

import listAdminUsers from "@/actions/admin/users/list-users";
import { isCurrentUserSuperAdmin, requireCurrentUserAdminAndActive } from "@/lib/auth/admin-check";
import { vacationToday } from "@/lib/vacations/dates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersAdminPanel } from "./_components/users-admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  try {
    await requireCurrentUserAdminAndActive();
  } catch {
    redirect("/");
  }

  const isSuperAdmin = await isCurrentUserSuperAdmin();
  const result = await listAdminUsers();

  return (
    <div className="w-full min-w-0 px-3 py-6 sm:px-4 sm:py-10">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Administración de usuarios</CardTitle>
            <CardDescription>
              Consulta vacaciones y vencimientos, revisa pendientes y administra el acceso del personal.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <UsersAdminPanel
            initialUsers={result.success ? result.data : []}
            initialError={result.success ? null : result.error}
            businessDate={vacationToday()}
            isSuperAdmin={isSuperAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
