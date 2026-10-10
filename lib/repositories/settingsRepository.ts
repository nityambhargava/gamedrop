import type { SupabaseClient } from '@supabase/supabase-js'

export interface SettingsRow {
  user_id: string
  default_target_price: number
  currency: string
  region: string
  email_notifications_enabled: boolean
}

// The ONLY columns a user is allowed to change through the API.
export interface SettingsUpdate {
  default_target_price?: number
  email_notifications_enabled?: boolean
}

const SETTINGS_COLUMNS =
  'user_id, default_target_price, currency, region, email_notifications_enabled'

export class SettingsRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByUserId(userId: string): Promise<SettingsRow | null> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select(SETTINGS_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to load settings: ${error.message}`)
    }

    return data
  }

  async update(userId: string, patch: SettingsUpdate): Promise<SettingsRow | null> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .update(patch)
      .eq('user_id', userId)
      .select(SETTINGS_COLUMNS)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`)
    }

    return data
  }
}