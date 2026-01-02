import { NextResponse } from "next/server";
import { restoreBackup } from "@/actions/restore-backup";

export const dynamic = 'force-dynamic';

/**
 * POST /api/restore
 * Restores a backup from local or cloud storage.
 * Only accessible to admin users.
 *
 * Body: { backupId: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { backupId } = body;

    if (!backupId || typeof backupId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: "backupId es requerido y debe ser una cadena"
        },
        { status: 400 }
      );
    }

    const result = await restoreBackup(backupId);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        restoredAt: new Date(),
        tablesAffected: [],
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
