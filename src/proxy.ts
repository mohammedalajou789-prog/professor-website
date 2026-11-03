import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { LANG_COOKIE, isLang } from '@/lib/i18n'

/**
 * 1) Language: URLs stay clean (/about). The language lives in a cookie and the
 *    request is rewritten internally to /en/about or /ar/about — both are
 *    statically pre-rendered, so navigation is instant and there is no flash.
 *    /ar/... or /en/... links set the cookie and redirect to the clean URL.
 * 2) Auth: only protected areas touch Supabase (keeps public pages fast).
 *    Courses and lectures are open to everyone; for signed-in visitors the session is refreshed.
 */
const PROTECTED = [/^\/admin(?!\/login)/, /^\/dashboard/]
/** open to everyone, but a signed-in visitor's session is refreshed here (downloads need it) */
const SESSION = [/^\/courses\/.+/]

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const first = pathname.split('/')[1]

  if (isLang(first)) {
    const clean = pathname.slice(first.length + 1) || '/'
    const res = NextResponse.redirect(new URL(clean + search, request.url))
    res.cookies.set(LANG_COOKIE, first, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
    return res
  }

  const cookieLang = request.cookies.get(LANG_COOKIE)?.value
  const lang = isLang(cookieLang) ? cookieLang : 'en'
  const target = new URL(`/${lang}${pathname === '/' ? '' : pathname}${search}`, request.url)

  let response = NextResponse.rewrite(target, { request })

  // local UI testing only (never set these on Vercel)
  const demo = (process.env.MN_DEMO_PUBLIC === '1' && pathname === '/admin/mn-guide') || (process.env.MOCK_DATA === '1' && process.env.ADMIN_PREVIEW === '1' && pathname.startsWith('/admin'))
  const guarded = PROTECTED.some((r) => r.test(pathname))
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))
  if (!demo && (guarded || (hasSession && SESSION.some((r) => r.test(pathname))))) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.rewrite(target, { request })
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      }
    )
    const { data } = await supabase.auth.getClaims()
    if (guarded && !data?.claims?.sub) {
      const url = new URL('/login', request.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next|images|fonts|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)'],
}
