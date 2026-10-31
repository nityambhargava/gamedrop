'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(false)

  const handleSignOut = async () => {
    setPending(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    // Drop everything cached for this user, so whoever signs in next on this
    // browser can never see it.
    queryClient.clear()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={handleSignOut}>
      Sign out
    </Button>
  )
}