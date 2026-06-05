import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient as createSSRClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Unauthenticated — send to login (except when already there)
  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated — check active status and role in a single query
  if (user && pathname !== '/login') {
    const { data: employee } = await supabase
      .from('employees')
      .select('role, active')
      .eq('id', user.id)
      .single()

    // Deactivated account — redirect to login (session expires naturally)
    if (!employee?.active) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Employee trying to reach admin routes
    if (pathname.startsWith('/admin') && employee?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
