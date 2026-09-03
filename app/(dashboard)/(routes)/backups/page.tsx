import { redirect } from "next/navigation";
import { BackupList } from "./components/backup-list";
import { CreateBackupButton } from "./components/create-backup-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUserSuperAdminAndActive } from "@/lib/auth/admin-check";

export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  try {
    await requireCurrentUserSuperAdminAndActive();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    redirect(message.includes("No autenticado") ? "/login" : "/");
  }

  // Fetch backups from local storage
  const { storageManager } = await import("@/lib/backup/storage-manager");
  const backups = await storageManager.listLocalBackups();

  return (
    <div className="flex flex-col">
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Backups</h1>
            <p className="text-muted-foreground">
              Gestiona los backups de la base de datos
            </p>
          </div>
          <CreateBackupButton />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Backups</CardTitle>
          </CardHeader>
          <CardContent>
            <BackupList initialBackups={backups} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
