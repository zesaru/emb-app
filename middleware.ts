import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get user to check authentication status
  const { data: { user }, error } = await supabase.auth.getUser()

  // Define route types
  const pathname = req.nextUrl.pathname
  const isAuthRoute = pathname === '/login' || pathname === '/reset'
  const isPublicRoute = pathname.startsWith('/auth') || 
                        pathname.startsWith('/api') || 
                        pathname.startsWith('/_next') ||
                        pathname === '/favicon.ico'
  const isProtectedRoute = !isAuthRoute && !isPublicRoute

  // If no user and trying to access protected route, redirect to login
  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user exists and trying to access auth routes, redirect to dashboard
  if (user && isAuthRoute) {
    const dashboardUrl = new URL('/', req.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public folder (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
