import { NextResponse } from "next/server";
import { CalendarAccessError, getCalendarEvents } from "@/actions/get-calendar-events";
import { parseCalendarRange } from "@/lib/calendar/events";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const range = parseCalendarRange(params.get("start"), params.get("end"));
  if (!range) return NextResponse.json({ error: "El periodo del calendario no es válido" }, { status: 400 });
  try {
    return NextResponse.json(await getCalendarEvents(range), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof CalendarAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("calendar:", error instanceof Error ? error.message : "Error desconocido");
    return NextResponse.json({ error: "No se pudo cargar el calendario. Intenta nuevamente." }, { status: 500 });
  }
}
