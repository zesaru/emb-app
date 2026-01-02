import { NextResponse } from "next/server";
import { createBackup } from "@/actions/create-backup";

export const dynamic = 'force-dynamic';

/**
 * POST /api/backup
 * Creates a backup of the database.
 * Only accessible to admin users.
 */
export async function POST() {
  try {
    const result = await createBackup();

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
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
