import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/SignOutButton'

export default async function DashboardPage() {
  const user = await getSessionUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: settings } = await supabase
    .from('user_settings')
    .select('default_target_price, currency, region')
    .eq('user_id', user.id)
    .single()

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Welcome, {profile?.display_name ?? user.email}</h1>
      <p>Email: {user.email}</p>
      <p>
        Default target price: {settings?.default_target_price} {settings?.currency} (
        {settings?.region})
      </p>
      <SignOutButton />
    </main>
  )
}