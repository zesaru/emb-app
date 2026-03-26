import { NextResponse } from "next/server";

import updateApproveRegisterHour from "@/actions/updateRegisterHour";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await updateApproveRegisterHour(payload);

    return NextResponse.json(result, {
      status: result?.success ? 200 : 400,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error inesperado",
      },
      { status: 500 },
    );
  }
}
