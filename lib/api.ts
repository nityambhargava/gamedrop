import type { AddedWishlistItem, SearchResult, Settings, StoreProduct, WishlistItem } from "@/types/api";

export const USE_MOCK = true;
export const SHOW_DEMO_BADGE = true;

export class ApiError extends Error {
  status: number;
  existingWishlistId?: string | undefined;

  constructor(message: string, status: number, existingWishlistId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.existingWishlistId = existingWishlistId;
  }
}

const defaultSettings: Settings = {
  defaultTargetPrice: 2000,
  currency: "INR",
  region: "IN",
  emailNotificationsEnabled: true,
};

const searchCatalog: SearchResult[] = [
  { providerProductId: "mock-alan-wake-2", title: "Alan Wake 2", platform: "PS5" },
  { providerProductId: "mock-cyberpunk-2077", title: "Cyberpunk 2077", platform: "PS5" },
  { providerProductId: "mock-ghost-tsushima", title: "Ghost of Tsushima Director’s Cut", platform: "PS5" },
  { providerProductId: "mock-horizon-forbidden-west", title: "Horizon Forbidden West", platform: "PS5" },
  { providerProductId: "mock-returnal", title: "Returnal", platform: "PS5" },
  { providerProductId: "mock-final-fantasy-xvi", title: "Final Fantasy XVI", platform: "PS5" },
  { providerProductId: "mock-the-last-of-us-part-i", title: "The Last of Us Part I", platform: "PS5" },
];

const seedWishlist: WishlistItem[] = [
  {
    id: "wishlist-alan-wake-2",
    storeProductId: "store-alan-wake-2",
    providerProductId: "mock-alan-wake-2",
    title: "Alan Wake 2",
    artworkUrl: null,
    platform: "PS5",
    edition: "Standard Edition",
    currentPrice: 1999,
    currency: "INR",
    targetPrice: 2000,
    status: "TARGET_REACHED",
    addedAt: "2026-10-04T10:30:00.000Z",
  },
  {
    id: "wishlist-cyberpunk-2077",
    storeProductId: "store-cyberpunk-2077",
    providerProductId: "mock-cyberpunk-2077",
    title: "Cyberpunk 2077",
    artworkUrl: null,
    platform: "PS5",
    edition: "Ultimate Edition",
    currentPrice: 1199,
    currency: "INR",
    targetPrice: 1500,
    status: "TARGET_REACHED",
    addedAt: "2026-10-02T14:00:00.000Z",
  },
  {
    id: "wishlist-ghost-of-tsushima",
    storeProductId: "store-ghost-of-tsushima",
    providerProductId: "mock-ghost-tsushima",
    title: "Ghost of Tsushima Director’s Cut",
    artworkUrl: null,
    platform: "PS5",
    edition: null,
    currentPrice: 3499,
    currency: "INR",
    targetPrice: defaultSettings.defaultTargetPrice,
    status: "ABOVE_TARGET",
    addedAt: "2026-09-29T08:15:00.000Z",
  },
  {
    id: "wishlist-returnal",
    storeProductId: "store-returnal",
    providerProductId: "mock-returnal",
    title: "Returnal",
    artworkUrl: null,
    platform: "PS5",
    edition: null,
    currentPrice: null,
    currency: null,
    targetPrice: defaultSettings.defaultTargetPrice,
    status: "UNAVAILABLE",
    addedAt: "2026-09-25T12:05:00.000Z",
  },
];

let mockSettings = { ...defaultSettings };
let mockWishlist = [...seedWishlist];

function validatePrice(value: number, field: string) {
  if (!Number.isFinite(value)) throw new ApiError(`${field} must be a finite number`, 400);
  if (value < 0) throw new ApiError(`${field} must not be negative`, 400);
  if (value > 500000) throw new ApiError(`${field} must not exceed 500000`, 400);
  // toFixed(2) rounds to 2 places; if rounding changes the value, it had more.
  // (Comparing value * 100 to its rounded self fails for valid prices like
  // 4.35, because of floating-point error.)
  if (Number(value.toFixed(2)) !== value) throw new ApiError(`${field} must have at most 2 decimal places`, 400);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const options: RequestInit = { ...init };
  if (init?.body) options.headers = { "Content-Type": "application/json", ...init.headers };
  const response = await fetch(path, options);
  if (response.status === 204) return undefined as T;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    const errorBody = body && typeof body === "object" ? body as { error?: unknown; existingWishlistId?: unknown } : {};
    const error = new ApiError(
      typeof errorBody.error === "string" ? errorBody.error : "Something went wrong. Please try again.",
      response.status,
      typeof errorBody.existingWishlistId === "string" ? errorBody.existingWishlistId : undefined,
    );
    if (response.status === 401 && typeof window !== "undefined") window.location.assign("/login");
    throw error;
  }
  return body as T;
}

export async function getSettings(): Promise<Settings> {
  if (!USE_MOCK) return request<Settings>("/api/settings");
  return { ...mockSettings };
}

export async function updateSettings(update: Partial<Pick<Settings, "defaultTargetPrice" | "emailNotificationsEnabled">>): Promise<Settings> {
  if (!Object.keys(update).length) throw new ApiError("Provide at least one setting to update", 400);
  if (update.defaultTargetPrice !== undefined) validatePrice(update.defaultTargetPrice, "defaultTargetPrice");
  if (update.emailNotificationsEnabled !== undefined && typeof update.emailNotificationsEnabled !== "boolean") {
    throw new ApiError("emailNotificationsEnabled must be a boolean", 400);
  }
  if (!USE_MOCK) return request<Settings>("/api/settings", { method: "PATCH", body: JSON.stringify(update) });
  mockSettings = { ...mockSettings, ...update };
  const newDefault = update.defaultTargetPrice;
  if (newDefault !== undefined) {
    mockWishlist = mockWishlist.map((item) => item.targetPrice === defaultSettings.defaultTargetPrice
      ? { ...item, targetPrice: newDefault, status: mockStatus(item.currentPrice, newDefault) }
      : item);
  }
  return { ...mockSettings };
}

export async function searchGames(query: string): Promise<{ results: SearchResult[] }> {
  const trimmed = query.trim();
  if (!trimmed) throw new ApiError('Query parameter "q" is required', 400);
  if (trimmed.length > 100) throw new ApiError('Query parameter "q" must be at most 100 characters', 400);
  if (!USE_MOCK) return request<{ results: SearchResult[] }>(`/api/games/search?q=${encodeURIComponent(trimmed)}`);
  return { results: searchCatalog.filter((item) => item.title.toLowerCase().includes(trimmed.toLowerCase())) };
}

export async function getWishlist(): Promise<{ items: WishlistItem[] }> {
  if (!USE_MOCK) return request<{ items: WishlistItem[] }>("/api/wishlist");
  return { items: [...mockWishlist].sort((a, b) => b.addedAt.localeCompare(a.addedAt)) };
}

export async function addToWishlist(providerProductId: string, customTargetPrice?: number): Promise<AddedWishlistItem> {
  if (!providerProductId) throw new ApiError("providerProductId is required", 400);
  if (customTargetPrice !== undefined) validatePrice(customTargetPrice, "customTargetPrice");
  if (!USE_MOCK) return request<AddedWishlistItem>("/api/wishlist", {
    method: "POST",
    body: JSON.stringify({ providerProductId, ...(customTargetPrice === undefined ? {} : { customTargetPrice }) }),
  });
  const existing = mockWishlist.find((item) => item.providerProductId === providerProductId);
  if (existing) throw new ApiError("This game is already in your wishlist", 409, existing.id);
  const result = searchCatalog.find((item) => item.providerProductId === providerProductId);
  if (!result) throw new ApiError("Game not found", 404);
  const storeProductId = `store-${providerProductId.replace("mock-", "")}`;
  const price = productData[storeProductId]?.price?.effectivePrice ?? null;
  const targetPrice = customTargetPrice ?? mockSettings.defaultTargetPrice;
  const item: WishlistItem = {
    id: `wishlist-${providerProductId.replace("mock-", "")}`,
    storeProductId,
    providerProductId,
    title: result.title,
    artworkUrl: null,
    platform: result.platform,
    edition: null,
    currentPrice: price,
    currency: price === null ? null : mockSettings.currency,
    targetPrice,
    status: mockStatus(price, targetPrice),
    addedAt: new Date().toISOString(),
  };
  mockWishlist = [item, ...mockWishlist];
  // Return only what the real server returns, so mock mode can't hide a
  // mismatch between the mock and the real API.
  return {
    id: item.id,
    storeProductId: item.storeProductId,
    providerProductId: item.providerProductId,
    title: item.title,
    platform: item.platform,
    edition: item.edition,
    customTargetPrice: customTargetPrice ?? null,
    addedAt: item.addedAt,
  };
}

function mockStatus(price: number | null, target: number): WishlistItem["status"] {
  if (price === null) return "UNAVAILABLE";
  return price <= target ? "TARGET_REACHED" : "ABOVE_TARGET";
}

export async function updateWishlistTarget(id: string, customTargetPrice: number | null): Promise<{ id: string; customTargetPrice: number | null }> {
  if (customTargetPrice !== null) validatePrice(customTargetPrice, "customTargetPrice");
  if (!USE_MOCK) return request(`/api/wishlist/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ customTargetPrice }),
  });
  const itemIndex = mockWishlist.findIndex((item) => item.id === id);
  const current = itemIndex >= 0 ? mockWishlist[itemIndex] : undefined;
  if (!current) throw new ApiError("Wishlist entry not found", 404);
  const targetPrice = customTargetPrice ?? mockSettings.defaultTargetPrice;
  mockWishlist[itemIndex] = {
    ...current,
    targetPrice,
    status: mockStatus(current.currentPrice, targetPrice),
  };
  return { id, customTargetPrice };
}

export async function removeFromWishlist(id: string): Promise<void> {
  if (!USE_MOCK) return request<void>(`/api/wishlist/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!mockWishlist.some((item) => item.id === id)) throw new ApiError("Wishlist entry not found", 404);
  mockWishlist = mockWishlist.filter((item) => item.id !== id);
}

const productData: Record<string, StoreProduct> = {
  "store-alan-wake-2": {
    id: "store-alan-wake-2", providerProductId: "mock-alan-wake-2", title: "Alan Wake 2", platform: "PS5",
    edition: "Standard Edition", region: "IN", artworkUrl: null, available: true,
    price: { currency: "INR", basePrice: 3999, salePrice: 1999, effectivePrice: 1999, discountPercentage: 50, saleExpiresAt: null, observedAt: "2026-10-04T10:30:00.000Z" },
  },
  "store-cyberpunk-2077": {
    id: "store-cyberpunk-2077", providerProductId: "mock-cyberpunk-2077", title: "Cyberpunk 2077", platform: "PS5",
    edition: "Ultimate Edition", region: "IN", artworkUrl: null, available: true,
    price: { currency: "INR", basePrice: 4999, salePrice: 1199, effectivePrice: 1199, discountPercentage: 76, saleExpiresAt: null, observedAt: "2026-10-02T14:00:00.000Z" },
  },
  "store-ghost-of-tsushima": {
    id: "store-ghost-of-tsushima", providerProductId: "mock-ghost-tsushima", title: "Ghost of Tsushima Director’s Cut", platform: "PS5",
    edition: null, region: "IN", artworkUrl: null, available: true,
    price: { currency: "INR", basePrice: 4999, salePrice: 3499, effectivePrice: 3499, discountPercentage: 30, saleExpiresAt: null, observedAt: "2026-09-29T08:15:00.000Z" },
  },
  "store-returnal": {
    id: "store-returnal", providerProductId: "mock-returnal", title: "Returnal", platform: "PS5",
    edition: null, region: "IN", artworkUrl: null, available: false, price: null,
  },
};

export async function getStoreProduct(storeProductId: string): Promise<StoreProduct> {
  if (!USE_MOCK) return request<StoreProduct>(`/api/store-products/${encodeURIComponent(storeProductId)}`);
  const product = productData[storeProductId];
  if (!product) throw new ApiError("Store product not found", 404);
  return { ...product };
}

export interface MockAlert {
  id: string;
  message: string;
  title: string;
  createdAt: string;
}

// NOT AVAILABLE YET: alerts are a mock-only preview until the API contract includes them.
export async function getAlerts(): Promise<MockAlert[]> {
  if (!USE_MOCK) return [];
  return [{
    id: "alert-alan-wake-2",
    title: "Alan Wake 2 reached your target",
    message: "Alan Wake 2 is now ₹1,999. Your target price was ₹2,000.",
    createdAt: "2026-10-04T10:30:00.000Z",
  }];
}