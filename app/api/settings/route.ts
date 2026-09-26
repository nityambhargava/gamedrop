import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('default_target_price, currency, region, email_notifications_enabled')
    .eq('user_id', user.id)
    .single()

  if (error || !settings) {
    return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
  }

  return NextResponse.json({
    defaultTargetPrice: settings.default_target_price,
    currency: settings.currency,
    region: settings.region,
    emailNotificationsEnabled: settings.email_notifications_enabled,
  })
}