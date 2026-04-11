/**
 * Middleware — UX Redirects Only
 *
 * ⚠️ CRITICAL (CVE-2025-29927):
 * This middleware is for UX convenience ONLY.
 * Security enforcement happens in the DAL via verifySession().
 * NEVER rely on middleware for access control.
 *
 * Behavior:
 * - No session cookie → redirect to /gate?redirect={pathname}
 * - Bypass: /gate, /api/*, /admin/*, /_next/*, static assets
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest): NextResponse {
    const session = request.cookies.get('session')
    const { pathname } = request.nextUrl

    // Always allow access to these paths
    if (
        pathname.startsWith('/gate') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml'
    ) {
        return NextResponse.next()
    }

    // No session → redirect to gate for UX convenience
    if (!session) {
        const gateUrl = new URL('/gate', request.url)

        // Preserve the intended destination
        if (pathname !== '/') {
            gateUrl.searchParams.set('redirect', pathname)
        }

        return NextResponse.redirect(gateUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon)
         * - public files with extensions
         */
        '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}
