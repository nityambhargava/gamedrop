import type { PriceProvider } from './PriceProvider'
import { MockPriceProvider } from './MockPriceProvider'

export const ACTIVE_PROVIDER_NAME = 'mock' as const
export const DEFAULT_REGION = 'IN' as const

export function getPriceProvider(): PriceProvider {
  return new MockPriceProvider()
}