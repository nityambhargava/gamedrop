import type { GamePrice, GameSearchResult } from '@/lib/types/gamePrice'

export class GameNotFoundError extends Error {
  constructor(providerProductId: string) {
    super(`No game found for product id: ${providerProductId}`)
    this.name = 'GameNotFoundError'
  }
}

export interface PriceProvider {
  searchGames(query: string, region: string): Promise<GameSearchResult[]>
  getCurrentPrice(providerProductId: string, region: string): Promise<GamePrice>
}