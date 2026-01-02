import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { BackupList } from "./components/backup-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session === null) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from("users")
    .select("admin")
    .eq("id", session.user.id)
    .single();

  if (userData?.admin !== "admin") {
    redirect("/");
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
          <form action="/api/backup" method="POST">
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Crear Backup
            </Button>
          </form>
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
