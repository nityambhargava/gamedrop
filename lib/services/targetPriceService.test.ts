import { describe, expect, it } from 'vitest'
import {
  computeEffectiveTargetPrice,
  computeWishlistStatus,
} from './targetPriceService'

describe('computeEffectiveTargetPrice', () => {
  it('uses the custom target price when set', () => {
    expect(computeEffectiveTargetPrice(1500, 2000)).toBe(1500)
  })

  it('falls back to the default target price when custom is null', () => {
    expect(computeEffectiveTargetPrice(null, 2000)).toBe(2000)
  })

  it('treats zero as a valid custom target price, not "unset"', () => {
    expect(computeEffectiveTargetPrice(0, 2000)).toBe(0)
  })
})

describe('computeWishlistStatus', () => {
  it('returns TARGET_REACHED when price is at or below target', () => {
    expect(computeWishlistStatus(1199, 1500)).toBe('TARGET_REACHED')
    expect(computeWishlistStatus(1500, 1500)).toBe('TARGET_REACHED')
  })

  it('returns ABOVE_TARGET when price is above target', () => {
    expect(computeWishlistStatus(1999, 1500)).toBe('ABOVE_TARGET')
  })

  it('returns UNAVAILABLE when current price is null', () => {
    expect(computeWishlistStatus(null, 1500)).toBe('UNAVAILABLE')
  })
})