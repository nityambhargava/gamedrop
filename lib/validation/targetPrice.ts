export const MAX_TARGET_PRICE = 500_000

export type TargetPriceValidationResult =
  | { valid: true; value: number | null }
  | { valid: false; error: string }

type AmountValidationResult =
  | { valid: true; value: number }
  | { valid: false; error: string }

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  if (Number.isInteger(value)) return true
  const [, decimals] = value.toString().split('.')
  return decimals === undefined || decimals.length <= 2
}

function validatePriceAmount(input: unknown, field: string): AmountValidationResult {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    return { valid: false, error: `${field} must be a finite number` }
  }

  if (input < 0) {
    return { valid: false, error: `${field} must not be negative` }
  }

  if (input > MAX_TARGET_PRICE) {
    return { valid: false, error: `${field} must not exceed ${MAX_TARGET_PRICE}` }
  }

  if (!hasAtMostTwoDecimalPlaces(input)) {
    return { valid: false, error: `${field} must have at most 2 decimal places` }
  }

  return { valid: true, value: input }
}

// Per-game override: undefined/null means "no custom price, use the default".
export function validateCustomTargetPrice(
  input: unknown
): TargetPriceValidationResult {
  if (input === undefined || input === null) {
    return { valid: true, value: null }
  }

  return validatePriceAmount(input, 'customTargetPrice')
}

// Global default: always required to be a real number (the column is NOT NULL).
export function validateDefaultTargetPrice(input: unknown): AmountValidationResult {
  return validatePriceAmount(input, 'defaultTargetPrice')
}