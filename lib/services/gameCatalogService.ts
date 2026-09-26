import {
  DuplicateMappingError,
  GameCatalogRepository,
} from '@/lib/repositories/gameCatalogRepository'
import { ACTIVE_PROVIDER_NAME } from '@/lib/providers/config'
import type { GamePrice } from '@/lib/types/gamePrice'

export interface ResolvedMapping {
  mappingId: string
  gameId: string
}

export class GameCatalogService {
  constructor(
    private repository: GameCatalogRepository = new GameCatalogRepository(),
    private provider: string = ACTIVE_PROVIDER_NAME
  ) {}

  async findOrCreateMapping(resolved: GamePrice): Promise<ResolvedMapping> {
    const existingMapping = await this.repository.findMappingByProviderProductId(
      this.provider,
      resolved.providerProductId,
      resolved.region
    )

    if (existingMapping) {
      return { mappingId: existingMapping.id, gameId: existingMapping.game_id }
    }

    let game = await this.repository.findGameByTitle(resolved.title)

    if (!game) {
      game = await this.repository.createGame(resolved.title)
    }

    try {
      const mapping = await this.repository.createMapping({
        gameId: game.id,
        provider: this.provider,
        providerProductId: resolved.providerProductId,
        platform: resolved.platform,
        edition: resolved.edition ?? null,
        region: resolved.region,
      })

      return { mappingId: mapping.id, gameId: mapping.game_id }
    } catch (err) {
      if (err instanceof DuplicateMappingError) {
        // Lost the race — someone else created this exact mapping between
        // our lookup above and this insert. Use theirs instead of failing.
        const nowExists = await this.repository.findMappingByProviderProductId(
          this.provider,
          resolved.providerProductId,
          resolved.region
        )

        if (nowExists) {
          return { mappingId: nowExists.id, gameId: nowExists.game_id }
        }
      }

      throw err
    }
  }
}