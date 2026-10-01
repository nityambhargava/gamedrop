export type WishlistItemStatus = 'TARGET_REACHED' | 'ABOVE_TARGET' | 'UNAVAILABLE'

export function computeEffectiveTargetPrice(
  customTargetPrice: number | null,
  defaultTargetPrice: number
): number {
  return customTargetPrice ?? defaultTargetPrice
}

export function computeWishlistStatus(
  currentPrice: number | null,
  effectiveTargetPrice: number
): WishlistItemStatus {
  if (currentPrice === null) {
    return 'UNAVAILABLE'
  }

  return currentPrice <= effectiveTargetPrice ? 'TARGET_REACHED' : 'ABOVE_TARGET'
}