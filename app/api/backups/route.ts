import { NextResponse } from "next/server";
import { getBackups } from "@/actions/get-backups";

export const dynamic = 'force-dynamic';

/**
 * GET /api/backups
 * Lists all available backups from both local and cloud storage.
 * Only accessible to admin users.
 */
export async function GET() {
  try {
    const backups = await getBackups();
    return NextResponse.json(backups, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: error instanceof Error && error.message.includes("No autorizado") ? 403 : 500 }
    );
  }
}
