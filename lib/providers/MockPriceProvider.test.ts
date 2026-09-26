import { describe, expect, it } from 'vitest'
import { MockPriceProvider } from './MockPriceProvider'
import { GameNotFoundError } from './PriceProvider'

describe('MockPriceProvider', () => {
  const provider = new MockPriceProvider()

  it('finds games by partial, case-insensitive title match', async () => {
    const results = await provider.searchGames('cyberpunk', 'IN')

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Cyberpunk 2077')
  })

  it('returns a normalized GamePrice with a correctly computed discount', async () => {
    const price = await provider.getCurrentPrice('mock-alan-wake-2', 'IN')

    expect(price.basePrice).toBe(3999)
    expect(price.effectivePrice).toBe(1999)
    expect(price.salePrice).toBe(1999)
    expect(price.discountPercentage).toBe(50)
    expect(price.currency).toBe('INR')
  })

  it('throws GameNotFoundError for an unknown product id', async () => {
    await expect(
      provider.getCurrentPrice('mock-does-not-exist', 'IN')
    ).rejects.toBeInstanceOf(GameNotFoundError)
  })
})