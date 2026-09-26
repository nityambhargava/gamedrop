import { createAdminClient } from '@/lib/supabase/admin'

export interface GameRow {
  id: string
  title: string
  artwork_url: string | null
}

export interface GameProviderMappingRow {
  id: string
  game_id: string
  provider: string
  provider_product_id: string
  platform: string
  edition: string | null
  region: string
}

export class DuplicateMappingError extends Error {
  constructor() {
    super('A mapping for this provider/product/region already exists')
    this.name = 'DuplicateMappingError'
  }
}

export class GameCatalogRepository {
  private admin = createAdminClient()

  async findMappingByProviderProductId(
    provider: string,
    providerProductId: string,
    region: string
  ): Promise<GameProviderMappingRow | null> {
    const { data, error } = await this.admin
      .from('game_provider_mapping')
      .select('*')
      .eq('provider', provider)
      .eq('provider_product_id', providerProductId)
      .eq('region', region)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to look up provider mapping: ${error.message}`)
    }

    return data
  }

  async findGameByTitle(title: string): Promise<GameRow | null> {
    // ilike with no wildcards = exact match, case-insensitive
    const { data, error } = await this.admin
      .from('games')
      .select('*')
      .ilike('title', title)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to look up game by title: ${error.message}`)
    }

    return data
  }

  async createGame(title: string): Promise<GameRow> {
    const { data, error } = await this.admin
      .from('games')
      .insert({ title })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(`Failed to create game: ${error?.message}`)
    }

    return data
  }

  async createMapping(input: {
    gameId: string
    provider: string
    providerProductId: string
    platform: string
    edition: string | null
    region: string
  }): Promise<GameProviderMappingRow> {
    const { data, error } = await this.admin
      .from('game_provider_mapping')
      .insert({
        game_id: input.gameId,
        provider: input.provider,
        provider_product_id: input.providerProductId,
        platform: input.platform,
        edition: input.edition,
        region: input.region,
      })
      .select('*')
      .single()

    if (error) {
      // Postgres unique_violation — another request created this exact
      // mapping between our lookup and this insert. Let the service
      // handle it by re-fetching, rather than surfacing a raw DB error.
      if (error.code === '23505') {
        throw new DuplicateMappingError()
      }
      throw new Error(`Failed to create provider mapping: ${error.message}`)
    }

    if (!data) {
      throw new Error('Failed to create provider mapping: no data returned')
    }

    return data
  }
}