export interface GameSearchResult {
  providerProductId: string
  title: string
  platform: string
  edition?: string
}

export interface GamePrice {
  providerProductId: string
  title: string
  platform: string
  edition?: string
  currency: string
  region: string
  basePrice: number
  salePrice: number | null
  effectivePrice: number
  discountPercentage: number
  saleExpiresAt: string | null
  observedAt: string
}