import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireCurrentUserAdminAndActive } from "@/lib/auth/admin-check";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")} ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")} UTC`;
}

export default async function AdminDevEmailsPage() {
  try {
    await requireCurrentUserAdminAndActive();
  } catch {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: emails, error } = await supabase
    .from("dev_email_outbox")
    .select("id, created_at, delivery_mode, template_name, from_email, to_emails, subject")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="w-full px-4 py-10">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Correos de desarrollo</CardTitle>
            <CardDescription>
              Correos capturados en desarrollo con su HTML renderizado. No salen
              a destinatarios reales mientras `EMAIL_DELIVERY_ENABLED=false`.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/users">Volver a Usuarios</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              No se pudo cargar la bandeja local de correos.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Modo</TableHead>
                    <TableHead>Plantilla</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Para</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(emails ?? []).map((email: any) => (
                    <TableRow key={email.id}>
                      <TableCell>{formatDate(email.created_at)}</TableCell>
                      <TableCell>{email.delivery_mode}</TableCell>
                      <TableCell>{email.template_name}</TableCell>
                      <TableCell>{email.subject}</TableCell>
                      <TableCell>{Array.isArray(email.to_emails) ? email.to_emails.join(", ") : "-"}</TableCell>
                      <TableCell>{email.from_email}</TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/dev-emails/${email.id}`}>Ver HTML</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(emails ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No hay correos capturados todavía.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
