import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Retired: native Supabase Cron is the only automatic writer. */
export async function GET() {
  return NextResponse.json({
    success: false,
    error: "La asignación automática de vacaciones se ejecuta en Supabase Cron",
  }, { status: 410 });
}
