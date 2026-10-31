import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginPage } from '@/components/pages/LoginPage'
import { getSessionUser } from '@/lib/auth/getSessionUser'

export const metadata: Metadata = { title: 'Sign in' }

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [{ error }, user] = await Promise.all([searchParams, getSessionUser()])

  if (user) {
    redirect('/')
  }

  return <LoginPage hasError={error === 'auth'} />
}