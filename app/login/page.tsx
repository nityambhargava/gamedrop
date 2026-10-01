'use client'

import { createClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const handleSignIn = async () => {
    const supabase = createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })
  }

  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <button onClick={handleSignIn}>Sign in with Google</button>
    </main>
  )
}