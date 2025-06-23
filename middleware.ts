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
  const isAuthRoute = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/reset'
  const isProtectedRoute = !isAuthRoute && 
                          !req.nextUrl.pathname.startsWith('/auth') && 
                          !req.nextUrl.pathname.startsWith('/api') &&
                          req.nextUrl.pathname !== '/favicon.ico'

  console.log('Middleware check:', {
    pathname: req.nextUrl.pathname,
    hasUser: !!user,
    isAuthRoute,
    isProtectedRoute,
    userError: error?.message
  })

  // If no user and trying to access protected route, redirect to login
  if (!user && isProtectedRoute) {
    console.log('No user, redirecting to login')
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user exists and trying to access auth routes, redirect to dashboard
  if (user && isAuthRoute) {
    console.log('User exists, redirecting to dashboard')
    const dashboardUrl = new URL('/', req.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
