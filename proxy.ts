import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === "/login" || pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  return await updateSession(request)
}
