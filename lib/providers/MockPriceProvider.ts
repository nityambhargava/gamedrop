import type { GamePrice, GameSearchResult } from '@/lib/types/gamePrice'
import { GameNotFoundError, type PriceProvider } from './PriceProvider'

interface MockGame {
  providerProductId: string
  title: string
  platform: string
  basePrice: number
  effectivePrice: number
}

const MOCK_GAMES: MockGame[] = [
  {
    providerProductId: 'mock-alan-wake-2',
    title: 'Alan Wake 2',
    platform: 'PS5',
    basePrice: 3999,
    effectivePrice: 1999,
  },
  {
    providerProductId: 'mock-hogwarts-legacy',
    title: 'Hogwarts Legacy',
    platform: 'PS5',
    basePrice: 3999,
    effectivePrice: 2499,
  },
  {
    providerProductId: 'mock-cyberpunk-2077',
    title: 'Cyberpunk 2077',
    platform: 'PS5',
    basePrice: 2999,
    effectivePrice: 1199,
  },
  {
    providerProductId: 'mock-ghost-of-tsushima',
    title: 'Ghost of Tsushima',
    platform: 'PS5',
    basePrice: 4999,
    effectivePrice: 2999,
  },
  {
    providerProductId: 'mock-red-dead-redemption-2',
    title: 'Red Dead Redemption 2',
    platform: 'PS5',
    basePrice: 2999,
    effectivePrice: 1539,
  },
]

function toGamePrice(game: MockGame, region: string): GamePrice {
  const isOnSale = game.effectivePrice < game.basePrice
  const discountPercentage = isOnSale
    ? Math.round(((game.basePrice - game.effectivePrice) / game.basePrice) * 100)
    : 0

  return {
    providerProductId: game.providerProductId,
    title: game.title,
    platform: game.platform,
    currency: 'INR',
    region,
    basePrice: game.basePrice,
    salePrice: isOnSale ? game.effectivePrice : null,
    effectivePrice: game.effectivePrice,
    discountPercentage,
    saleExpiresAt: null,
    observedAt: new Date().toISOString(),
  }
}

export class MockPriceProvider implements PriceProvider {
  async searchGames(query: string, _region: string): Promise<GameSearchResult[]> {
    const normalizedQuery = query.trim().toLowerCase()

    return MOCK_GAMES.filter((game) =>
      game.title.toLowerCase().includes(normalizedQuery)
    ).map((game) => ({
      providerProductId: game.providerProductId,
      title: game.title,
      platform: game.platform,
    }))
  }

  async getCurrentPrice(providerProductId: string, region: string): Promise<GamePrice> {
    const game = MOCK_GAMES.find((g) => g.providerProductId === providerProductId)

    if (!game) {
      throw new GameNotFoundError(providerProductId)
    }

    return toGamePrice(game, region)
  }
}