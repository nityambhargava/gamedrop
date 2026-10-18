export type WishlistStatus = "TARGET_REACHED" | "ABOVE_TARGET" | "UNAVAILABLE";

export interface SearchResult {
  providerProductId: string;
  title: string;
  platform: string;
}

export interface WishlistItem {
  id: string;
  storeProductId: string;
  providerProductId: string;
  title: string;
  artworkUrl: string | null;
  platform: string;
  edition: string | null;
  currentPrice: number | null;
  currency: string | null;
  targetPrice: number;
  status: WishlistStatus;
  addedAt: string;
}

export interface Settings {
  defaultTargetPrice: number;
  currency: string;
  region: string;
  emailNotificationsEnabled: boolean;
}

export interface StoreProduct {
  id: string;
  providerProductId: string;
  title: string;
  platform: string;
  edition: string | null;
  region: string;
  artworkUrl: string | null;
  available: boolean;
  price: {
    currency: string;
    basePrice: number;
    salePrice: number | null;
    effectivePrice: number;
    discountPercentage: number;
    saleExpiresAt: string | null;
    observedAt: string;
  } | null;
}

// Shape of the 201 response from POST /api/wishlist. Deliberately smaller than
// WishlistItem: the server does not include price or status fields here.
export interface AddedWishlistItem {
  id: string;
  storeProductId: string;
  providerProductId: string;
  title: string;
  platform: string;
  edition: string | null;
  customTargetPrice: number | null;
  addedAt: string;
}