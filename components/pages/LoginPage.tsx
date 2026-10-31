'use client'

import { useState } from 'react'
import { Gamepad2, LoaderCircle } from 'lucide-react'

import { createClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'

export function LoginPage({ hasError = false }: { hasError?: boolean }) {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [startFailed, setStartFailed] = useState(false)

  const handleSignIn = async () => {
    setIsRedirecting(true)
    setStartFailed(false)

    const supabase = createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        // Always show Google's account chooser.
        queryParams: { prompt: 'select_account' },
      },
    })

    // On success the browser navigates away to Google, so we only get here
    // if starting the flow failed.
    if (error) {
      setStartFailed(true)
      setIsRedirecting(false)
    }
  }

  const showError = hasError || startFailed

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-md bg-lime text-primary-foreground">
            <Gamepad2 className="size-6" strokeWidth={2.2} />
          </span>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Welcome to GameDrop</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Stop checking your PlayStation wishlist every day.
          </p>
        </div>

        <div className="space-y-4 rounded-md border border-border/70 bg-card/60 p-6">
          {showError && (
            <p
              role="alert"
              className="rounded-md border border-amber/25 bg-amber/10 px-3 py-2 text-xs text-amber"
            >
              Sign-in didn&apos;t complete. Please try again.
            </p>
          )}
          <Button className="w-full" disabled={isRedirecting} onClick={handleSignIn}>
            {isRedirecting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Continue with Google
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            GameDrop only uses Google to sign you in. We never ask for your PlayStation
            password or account details.
          </p>
        </div>
      </div>
    </div>
  )
}