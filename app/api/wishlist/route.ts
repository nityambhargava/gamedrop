import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { createClient } from '@/lib/supabase/server'
import { getPriceProvider, DEFAULT_REGION } from '@/lib/providers/config'
import { GameNotFoundError } from '@/lib/providers/PriceProvider'
import { GameCatalogService } from '@/lib/services/gameCatalogService'
import {
  DuplicateWishlistEntryError,
  WishlistRepository,
} from '@/lib/repositories/wishlistRepository'
import { validateCustomTargetPrice } from '@/lib/validation/targetPrice'

export async function POST(request: Request) {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { providerProductId, customTargetPrice } = (body ?? {}) as {
    providerProductId?: unknown
    customTargetPrice?: unknown
  }

  if (typeof providerProductId !== 'string' || providerProductId.trim() === '') {
    return NextResponse.json(
      { error: 'providerProductId is required' },
      { status: 400 }
    )
  }

  const priceValidation = validateCustomTargetPrice(customTargetPrice)

  if (!priceValidation.valid) {
    return NextResponse.json({ error: priceValidation.error }, { status: 400 })
  }

  // Server-side validation of product identity: the browser only tells us
  // WHICH product it means. Title, platform, edition, and region are all
  // re-resolved here — never trusted from the request body.
  const provider = getPriceProvider()
  let resolvedPrice
  try {
    resolvedPrice = await provider.getCurrentPrice(providerProductId, DEFAULT_REGION)
  } catch (err) {
    if (err instanceof GameNotFoundError) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    throw err
  }

  const catalogService = new GameCatalogService()
  const { mappingId } = await catalogService.findOrCreateMapping(resolvedPrice)

  const supabase = await createClient()
  const wishlistRepository = new WishlistRepository(supabase)

  try {
    const entry = await wishlistRepository.create({
      userId: user.id,
      mappingId,
      customTargetPrice: priceValidation.value,
    })

    return NextResponse.json(
      {
        id: entry.id,
        providerProductId: resolvedPrice.providerProductId,
        title: resolvedPrice.title,
        platform: resolvedPrice.platform,
        edition: resolvedPrice.edition ?? null,
        customTargetPrice: entry.custom_target_price,
        addedAt: entry.added_at,
      },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof DuplicateWishlistEntryError) {
      const existing = await wishlistRepository.findByUserAndMapping(user.id, mappingId)

      return NextResponse.json(
        {
          error: 'This game is already in your wishlist',
          existingWishlistId: existing?.id ?? null,
        },
        { status: 409 }
      )
    }

    throw err
  }
}