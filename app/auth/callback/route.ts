import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Don't trust request.url's origin behind a reverse proxy (Codespaces'
  // port forwarding, or production load balancers) — it can reflect an
  // internal hostname instead of the public one. Fall back to it only
  // if NEXT_PUBLIC_SITE_URL isn't set.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${siteUrl}/dashboard`)
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth`)
}