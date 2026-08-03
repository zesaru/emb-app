import { NextResponse } from "next/server";
import { createBackup } from "@/actions/create-backup";
import { verifyCronSecret } from "@/lib/cron/verify-cron-secret";

export const dynamic = 'force-dynamic';

async function runBackup() {
  try {
    const result = await createBackup();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        duration: 0
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron
 * Invocada por Vercel Cron (ver vercel.json). Protegida por CRON_SECRET.
 */
export async function GET(request: Request) {
  const verification = verifyCronSecret(request);
  if (!verification.authorized) {
    return verification.response;
  }

  return runBackup();
}

/**
 * POST /api/cron
 * Disparo manual equivalente al GET. Protegida por CRON_SECRET.
 */
export async function POST(request: Request) {
  const verification = verifyCronSecret(request);
  if (!verification.authorized) {
    return verification.response;
  }

  return runBackup();
}
