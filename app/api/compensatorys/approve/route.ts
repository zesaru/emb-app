import { NextResponse } from "next/server";

import updateApproveRegister from "@/actions/updateApproveRegister";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await updateApproveRegister(payload);

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
