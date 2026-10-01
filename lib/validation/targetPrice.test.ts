import { describe, expect, it } from 'vitest'
import { validateCustomTargetPrice, MAX_TARGET_PRICE } from './targetPrice'

describe('validateCustomTargetPrice', () => {
  it('accepts undefined and null as "no custom price"', () => {
    expect(validateCustomTargetPrice(undefined)).toEqual({ valid: true, value: null })
    expect(validateCustomTargetPrice(null)).toEqual({ valid: true, value: null })
  })

  it('accepts a valid non-negative number with up to 2 decimal places', () => {
    expect(validateCustomTargetPrice(1500)).toEqual({ valid: true, value: 1500 })
    expect(validateCustomTargetPrice(1499.99)).toEqual({ valid: true, value: 1499.99 })
    expect(validateCustomTargetPrice(0)).toEqual({ valid: true, value: 0 })
  })

  it('rejects non-numeric input', () => {
    expect(validateCustomTargetPrice('1500').valid).toBe(false)
  })

  it('rejects non-finite numbers', () => {
    expect(validateCustomTargetPrice(Infinity).valid).toBe(false)
    expect(validateCustomTargetPrice(NaN).valid).toBe(false)
  })

  it('rejects negative numbers', () => {
    expect(validateCustomTargetPrice(-1).valid).toBe(false)
  })

  it('rejects values above the maximum', () => {
    expect(validateCustomTargetPrice(MAX_TARGET_PRICE + 1).valid).toBe(false)
  })

  it('accepts the maximum value exactly', () => {
    expect(validateCustomTargetPrice(MAX_TARGET_PRICE)).toEqual({
      valid: true,
      value: MAX_TARGET_PRICE,
    })
  })

  it('rejects more than 2 decimal places', () => {
    expect(validateCustomTargetPrice(12.345).valid).toBe(false)
  })

  it('accepts exactly 2 decimal places', () => {
    expect(validateCustomTargetPrice(12.34)).toEqual({ valid: true, value: 12.34 })
  })
})