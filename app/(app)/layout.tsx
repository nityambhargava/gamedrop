import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getSessionUser } from '@/lib/auth/getSessionUser'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}