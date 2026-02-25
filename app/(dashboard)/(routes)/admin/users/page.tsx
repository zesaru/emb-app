import { redirect } from "next/navigation";

import listAdminUsers from "@/actions/admin/users/list-users";
import { requireCurrentUserAdminAndActive } from "@/lib/auth/admin-check";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersAdminPanel } from "./_components/users-admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  try {
    await requireCurrentUserAdminAndActive();
  } catch {
    redirect("/");
  }

  const result = await listAdminUsers();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Administración de Usuarios</CardTitle>
          <CardDescription>
            Crea usuarios, cambia roles, administra el estado de acceso y gestiona restablecimiento de contraseñas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersAdminPanel
            initialUsers={result.success ? result.data : []}
            initialError={result.success ? null : result.error}
          />
        </CardContent>
      </Card>
    </div>
  );
}
