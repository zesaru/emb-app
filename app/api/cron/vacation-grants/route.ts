import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/lib/cron/verify-cron-secret";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { runAutomaticVacationGrants } from "@/lib/vacations/automatic-grants";

export const dynamic = "force-dynamic";

/** Daily anniversary grants. An authenticated dry run never changes data. */
export async function GET(request: Request) {
  const verification = verifyCronSecret(request);
  if (!verification.authorized) return verification.response;

  try {
    const result = await runAutomaticVacationGrants(getSupabaseAdminClient(), {
      dryRun: new URL(request.url).searchParams.get("dryRun") === "true",
    });
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch {
    return NextResponse.json({ success: false, error: "No se pudo completar la asignación automática de vacaciones" }, { status: 500 });
  }
}
