import type { SupabaseClient } from '@supabase/supabase-js'

export interface WishlistRow {
  id: string
  user_id: string
  game_provider_mapping_id: string
  custom_target_price: number | null
  added_at: string
}

export class DuplicateWishlistEntryError extends Error {
  constructor() {
    super('This product is already in the wishlist')
    this.name = 'DuplicateWishlistEntryError'
  }
}

export class WishlistRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByUserAndMapping(
    userId: string,
    mappingId: string
  ): Promise<WishlistRow | null> {
    const { data, error } = await this.supabase
      .from('user_wishlist')
      .select('*')
      .eq('user_id', userId)
      .eq('game_provider_mapping_id', mappingId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to look up wishlist entry: ${error.message}`)
    }

    return data
  }

  async create(input: {
    userId: string
    mappingId: string
    customTargetPrice: number | null
  }): Promise<WishlistRow> {
    const { data, error } = await this.supabase
      .from('user_wishlist')
      .insert({
        user_id: input.userId,
        game_provider_mapping_id: input.mappingId,
        custom_target_price: input.customTargetPrice,
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new DuplicateWishlistEntryError()
      }
      throw new Error(`Failed to create wishlist entry: ${error.message}`)
    }

    if (!data) {
      throw new Error('Failed to create wishlist entry: no data returned')
    }

    return data
  }

    async updateCustomTargetPrice(
    id: string,
    userId: string,
    customTargetPrice: number | null
  ): Promise<WishlistRow | null> {
    const { data, error } = await this.supabase
      .from('user_wishlist')
      .update({ custom_target_price: customTargetPrice })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to update wishlist entry: ${error.message}`)
    }

    return data
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_wishlist')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')

    if (error) {
      throw new Error(`Failed to delete wishlist entry: ${error.message}`)
    }

    return (data?.length ?? 0) > 0
  }
}