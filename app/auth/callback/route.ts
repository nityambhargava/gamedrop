import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Behind a reverse proxy (Codespaces port forwarding, production load
  // balancers) request.url's origin can be an internal hostname, so prefer the
  // configured public URL.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${siteUrl}/`)
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth`)
}