import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { createClient } from '@/lib/supabase/server'
import {
  SettingsRepository,
  type SettingsRow,
  type SettingsUpdate,
} from '@/lib/repositories/settingsRepository'
import { validateDefaultTargetPrice } from '@/lib/validation/targetPrice'

function toSettingsResponse(row: SettingsRow) {
  return {
    defaultTargetPrice: row.default_target_price,
    currency: row.currency,
    region: row.region,
    emailNotificationsEnabled: row.email_notifications_enabled,
  }
}

export async function GET() {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const settings = await new SettingsRepository(supabase).findByUserId(user.id)

  if (!settings) {
    return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
  }

  return NextResponse.json(toSettingsResponse(settings))
}

export async function PATCH(request: Request) {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Request body must be a JSON object' },
      { status: 400 }
    )
  }

  const { defaultTargetPrice, emailNotificationsEnabled } = body as {
    defaultTargetPrice?: unknown
    emailNotificationsEnabled?: unknown
  }

  // Build the update field by field from an allow-list. Anything else in the
  // body (currency, region, user_id, ...) is never read, so it can't be written.
  const patch: SettingsUpdate = {}

  if (defaultTargetPrice !== undefined) {
    const validation = validateDefaultTargetPrice(defaultTargetPrice)

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    patch.default_target_price = validation.value
  }

  if (emailNotificationsEnabled !== undefined) {
    if (typeof emailNotificationsEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'emailNotificationsEnabled must be a boolean' },
        { status: 400 }
      )
    }

    patch.email_notifications_enabled = emailNotificationsEnabled
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      {
        error:
          'Provide at least one of: defaultTargetPrice, emailNotificationsEnabled',
      },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const updated = await new SettingsRepository(supabase).update(user.id, patch)

  if (!updated) {
    return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
  }

  return NextResponse.json(toSettingsResponse(updated))
}