import { NextResponse } from "next/server";
import { createBackup } from "@/actions/create-backup";

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron
 * Creates a backup via cron job.
 * Protected by CRON_SECRET environment variable.
 */
export async function POST(request: Request) {
  try {
    // Verify Authorization header
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error"
        },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing authorization header"
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (token !== cronSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid authorization token"
        },
        { status: 403 }
      );
    }

    // Create backup
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
