import { NextResponse } from "next/server";

type VerifyCronSecretResult =
  | { authorized: true }
  | { authorized: false; response: NextResponse };

/**
 * Verifica el bearer token de un request de cron contra CRON_SECRET.
 * Vercel Cron agrega automáticamente `Authorization: Bearer $CRON_SECRET`
 * cuando esa env var está configurada en el proyecto.
 */
export function verifyCronSecret(request: Request): VerifyCronSecretResult {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 },
      ),
    };
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Missing authorization header" },
        { status: 401 },
      ),
    };
  }

  const token = authHeader.substring(7);
  if (token !== cronSecret) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Invalid authorization token" },
        { status: 403 },
      ),
    };
  }

  return { authorized: true };
}
