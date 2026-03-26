import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireCurrentUserAdminAndActive } from "@/lib/auth/admin-check";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")} ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")} UTC`;
}

export default async function AdminDevEmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireCurrentUserAdminAndActive();
  } catch {
    redirect("/");
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: email, error } = await supabase
    .from("dev_email_outbox")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !email) {
    notFound();
  }

  return (
    <div className="w-full space-y-6 px-4 py-10">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/admin/dev-emails">Volver a Emails Dev</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/users">Volver a usuarios</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{email.subject}</CardTitle>
          <CardDescription>
            {email.template_name} · {email.delivery_mode} · {formatDate(email.created_at)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium">Desde</div>
              <div className="text-muted-foreground">{email.from_email}</div>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium">Para</div>
              <div className="text-muted-foreground">
                {Array.isArray(email.to_emails) ? email.to_emails.join(", ") : "-"}
              </div>
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="mb-2 text-sm font-medium">Payload</div>
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">
              {JSON.stringify(email.payload_json ?? {}, null, 2)}
            </pre>
          </div>

          <div className="rounded-md border">
            <div className="border-b px-3 py-2 text-sm font-medium">Preview HTML</div>
            <iframe
              title={`email-preview-${email.id}`}
              className="h-[900px] w-full bg-white"
              srcDoc={email.html_body}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
