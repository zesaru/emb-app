import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const headers = { 'Cache-Control': 'private, no-store' }
  const origin = request.headers.get('origin')
  if ((origin && origin !== requestUrl.origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'Solicitud no permitida.' }, { status: 403, headers })
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw error
  } catch {
    return NextResponse.json(
      { error: 'No se pudo cerrar la sesión. Inténtalo de nuevo.' },
      { status: 503, headers },
    )
  }

  if (request.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json({ success: true }, { headers })
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`, {
    // See Other makes the next navigation a GET without a permanent redirect.
    status: 303,
    headers,
  })
}
