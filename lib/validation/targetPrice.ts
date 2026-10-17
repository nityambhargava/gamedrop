export const MAX_TARGET_PRICE = 500_000

export type TargetPriceValidationResult =
  | { valid: true; value: number | null }
  | { valid: false; error: string }

type AmountValidationResult =
  | { valid: true; value: number }
  | { valid: false; error: string }

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  // toFixed(2) rounds to 2 places; if that changes the value, it had more.
  // (Splitting toString() on '.' breaks for tiny values like 1e-7, which
  // print in exponent notation.)
  return Number(value.toFixed(2)) === value
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