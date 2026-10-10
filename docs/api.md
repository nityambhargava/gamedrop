# GameDrop API Contract

The frontend talks ONLY to these endpoints. It never calls the PlayStation Store
directly, and never sends a `userId` (identity always comes from the session).

> **Data note:** until Phase 3, all game data and prices come from a mock
> provider. They are demo values, not live PlayStation Store prices.

## Conventions

- **Base:** same-origin, relative URLs (`/api/...`).
- **Auth:** a Supabase session cookie, set by the Google sign-in flow at `/login`.
  There are no tokens or auth headers to manage. Same-origin `fetch` sends the
  cookie automatically.
- **Errors:** always `{ "error": "message" }` with a meaningful status code:
  `400` invalid input, `401` not signed in, `404` not found, `409` conflict,
  `500` unexpected failure.
- **Money:** plain numbers in major units (e.g. `1999` = ₹1,999), always paired
  with a `currency` field (`"INR"` for the India MVP). Format on the client.
- **Two different ids:**
  - `id` on a wishlist item = the wishlist row. Use for `PATCH`/`DELETE /api/wishlist/:id`.
  - `storeProductId` = the specific store product/SKU (one edition on one platform).
    Use for `GET /api/store-products/:id`.
  - `providerProductId` = the store's own id; only used to add a game
    (`POST /api/wishlist`).

## Types

```ts
type WishlistStatus = 'TARGET_REACHED' | 'ABOVE_TARGET' | 'UNAVAILABLE'

interface SearchResult {
  providerProductId: string
  title: string
  platform: string
}

interface WishlistItem {
  id: string
  storeProductId: string
  providerProductId: string
  title: string
  artworkUrl: string | null
  platform: string
  edition: string | null
  currentPrice: number | null   // null when UNAVAILABLE
  currency: string | null       // null when UNAVAILABLE
  targetPrice: number           // the effective target (custom, else global)
  status: WishlistStatus
  addedAt: string               // ISO 8601
}
```

`TARGET_REACHED` means `currentPrice <= targetPrice`. `UNAVAILABLE` means the
store can't currently price the product (e.g. delisted); show it, but not as a deal.

---

## GET /api/health
Auth: none

`200`:
```json
{ "status": "ok", "database": "connected", "responseTimeMs": 123 }
```
`503`:
```json
{ "status": "error", "database": "unreachable", "message": "..." }
```

## GET /api/settings
Auth: required

`200`:
```json
{
  "defaultTargetPrice": 2000,
  "currency": "INR",
  "region": "IN",
  "emailNotificationsEnabled": true
}
```
`401`: `{ "error": "Unauthorized" }`

## PATCH /api/settings  — COMING IN STEP 10 (not built yet)
Will update the global default target price (and email notification toggle).

## GET /api/games/search?q=<query>
Auth: required. `q` is required, max 100 characters.

`200` (`results` may be an empty array):
```json
{
  "results": [
    { "providerProductId": "mock-cyberpunk-2077", "title": "Cyberpunk 2077", "platform": "PS5" }
  ]
}
```
`400`: `{ "error": "Query parameter \"q\" is required" }`
`401`: `{ "error": "Unauthorized" }`

## POST /api/wishlist
Auth: required

Request (`customTargetPrice` optional; omit to use the global default):
```json
{ "providerProductId": "mock-cyberpunk-2077", "customTargetPrice": 1500 }
```
`customTargetPrice` rules: a finite number, 0 to 500000, at most 2 decimal places.

`201`:
```json
{
  "id": "b7bcbb83-...",
  "storeProductId": "d35a934b-...",
  "providerProductId": "mock-cyberpunk-2077",
  "title": "Cyberpunk 2077",
  "platform": "PS5",
  "edition": null,
  "customTargetPrice": 1500,
  "addedAt": "2026-10-01T12:00:00.000Z"
}
```
`400`: `{ "error": "customTargetPrice must not be negative" }` (or `providerProductId is required`, etc.)
`404`: `{ "error": "Game not found" }`
`409` (already on the wishlist; use `existingWishlistId` to offer "edit target instead"):
```json
{ "error": "This game is already in your wishlist", "existingWishlistId": "b7bcbb83-..." }
```

## GET /api/wishlist
Auth: required. Newest first. Only ever returns the caller's own items.

`200`:
```json
{
  "items": [
    {
      "id": "b7bcbb83-...",
      "storeProductId": "d35a934b-...",
      "providerProductId": "mock-cyberpunk-2077",
      "title": "Cyberpunk 2077",
      "artworkUrl": null,
      "platform": "PS5",
      "edition": null,
      "currentPrice": 1199,
      "currency": "INR",
      "targetPrice": 1500,
      "status": "TARGET_REACHED",
      "addedAt": "2026-10-01T12:00:00.000Z"
    }
  ]
}
```
`401`: `{ "error": "Unauthorized" }`

## PATCH /api/wishlist/:id
Auth: required. `:id` is the wishlist item `id`.

Request: `{ "customTargetPrice": 1300 }`, or `{ "customTargetPrice": null }` to
clear the custom price and fall back to the global default. The field itself is required.

`200`: `{ "id": "b7bcbb83-...", "customTargetPrice": 1300 }`
`400`: `{ "error": "customTargetPrice is required (pass null to clear it)" }` or a validation message
`404`: `{ "error": "Wishlist entry not found" }` (also returned for items belonging to other users)

## DELETE /api/wishlist/:id
Auth: required. `:id` is the wishlist item `id`.

`204`: empty body (do not call `.json()` on it)
`404`: `{ "error": "Wishlist entry not found" }`

## GET /api/store-products/:id
Auth: required. `:id` is `storeProductId`.

`200`:
```json
{
  "id": "d35a934b-...",
  "providerProductId": "mock-cyberpunk-2077",
  "title": "Cyberpunk 2077",
  "platform": "PS5",
  "edition": null,
  "region": "IN",
  "artworkUrl": null,
  "available": true,
  "price": {
    "currency": "INR",
    "basePrice": 2999,
    "salePrice": 1199,
    "effectivePrice": 1199,
    "discountPercentage": 60,
    "saleExpiresAt": null,
    "observedAt": "2026-10-01T12:00:00.000Z"
  }
}
```
When the product exists but the store can't price it: same shape with
`"available": false` and `"price": null`.

`404`: `{ "error": "Store product not found" }`
`401`: `{ "error": "Unauthorized" }`