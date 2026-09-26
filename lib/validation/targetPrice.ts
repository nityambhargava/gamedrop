export const MAX_TARGET_PRICE = 500_000

export type TargetPriceValidationResult =
  | { valid: true; value: number | null }
  | { valid: false; error: string }

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  if (Number.isInteger(value)) return true
  const [, decimals] = value.toString().split('.')
  return decimals === undefined || decimals.length <= 2
}

export function validateCustomTargetPrice(
  input: unknown
): TargetPriceValidationResult {
  if (input === undefined || input === null) {
    return { valid: true, value: null }
  }

  if (typeof input !== 'number' || !Number.isFinite(input)) {
    return { valid: false, error: 'customTargetPrice must be a finite number' }
  }

  if (input < 0) {
    return { valid: false, error: 'customTargetPrice must not be negative' }
  }

  if (input > MAX_TARGET_PRICE) {
    return {
      valid: false,
      error: `customTargetPrice must not exceed ${MAX_TARGET_PRICE}`,
    }
  }

  if (!hasAtMostTwoDecimalPlaces(input)) {
    return {
      valid: false,
      error: 'customTargetPrice must have at most 2 decimal places',
    }
  }

  return { valid: true, value: input }
}