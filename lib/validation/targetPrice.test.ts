import { describe, expect, it } from 'vitest'
import {
  validateCustomTargetPrice,
  validateDefaultTargetPrice,
  MAX_TARGET_PRICE,
} from './targetPrice'

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

describe('validateDefaultTargetPrice', () => {
  it('accepts a valid number', () => {
    expect(validateDefaultTargetPrice(2000)).toEqual({ valid: true, value: 2000 })
    expect(validateDefaultTargetPrice(1499.5)).toEqual({ valid: true, value: 1499.5 })
  })

  it('rejects null and undefined (unlike the custom price)', () => {
    expect(validateDefaultTargetPrice(null).valid).toBe(false)
    expect(validateDefaultTargetPrice(undefined).valid).toBe(false)
  })

  it('rejects strings, negatives, oversize values and extra decimals', () => {
    expect(validateDefaultTargetPrice('2000').valid).toBe(false)
    expect(validateDefaultTargetPrice(-1).valid).toBe(false)
    expect(validateDefaultTargetPrice(MAX_TARGET_PRICE + 1).valid).toBe(false)
    expect(validateDefaultTargetPrice(10.999).valid).toBe(false)
  })

  it('names the right field in its error message', () => {
    const result = validateDefaultTargetPrice(-1)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('defaultTargetPrice')
    }
  })
})