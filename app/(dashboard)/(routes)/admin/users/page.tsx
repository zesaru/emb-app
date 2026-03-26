import Link from "next/link";
import { redirect } from "next/navigation";

import listAdminUsers from "@/actions/admin/users/list-users";
import { requireCurrentUserAdminAndActive } from "@/lib/auth/admin-check";
import { Button } from "@/components/ui/button";
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
    <div className="w-full px-4 py-10">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Administracion de Usuarios</CardTitle>
            <CardDescription>
              Crea usuarios, cambia roles, administra el estado de acceso y gestiona restablecimiento de contrasenas.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/dev-emails">Emails Dev</Link>
          </Button>
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
