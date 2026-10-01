import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { createClient } from '@/lib/supabase/server'
import { getPriceProvider, DEFAULT_REGION } from '@/lib/providers/config'
import { GameNotFoundError } from '@/lib/providers/PriceProvider'
import { GameCatalogService } from '@/lib/services/gameCatalogService'
import {
  computeEffectiveTargetPrice,
  computeWishlistStatus,
} from '@/lib/services/targetPriceService'
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

export async function GET() {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('default_target_price')
    .eq('user_id', user.id)
    .single()

  if (settingsError || !settings) {
    return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
  }

  const { data: wishlistRows, error: wishlistError } = await supabase
    .from('user_wishlist')
    .select(
      `
      id,
      custom_target_price,
      added_at,
      game_provider_mapping (
        provider_product_id,
        platform,
        edition,
        games ( title )
      )
    `
    )
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  if (wishlistError) {
    return NextResponse.json({ error: 'Failed to load wishlist' }, { status: 500 })
  }

  const provider = getPriceProvider()

  const items = await Promise.all(
    (wishlistRows ?? []).map(async (row) => {
      const mapping = row.game_provider_mapping
      const effectiveTargetPrice = computeEffectiveTargetPrice(
        row.custom_target_price,
        settings.default_target_price
      )

      try {
        const currentPrice = await provider.getCurrentPrice(
          mapping.provider_product_id,
          DEFAULT_REGION
        )

        return {
          id: row.id,
          providerProductId: mapping.provider_product_id,
          title: mapping.games.title,
          platform: mapping.platform,
          edition: mapping.edition,
          currentPrice: currentPrice.effectivePrice,
          currency: currentPrice.currency,
          targetPrice: effectiveTargetPrice,
          status: computeWishlistStatus(currentPrice.effectivePrice, effectiveTargetPrice),
          addedAt: row.added_at,
        }
      } catch (err) {
        if (err instanceof GameNotFoundError) {
          return {
            id: row.id,
            providerProductId: mapping.provider_product_id,
            title: mapping.games.title,
            platform: mapping.platform,
            edition: mapping.edition,
            currentPrice: null,
            currency: null,
            targetPrice: effectiveTargetPrice,
            status: computeWishlistStatus(null, effectiveTargetPrice),
            addedAt: row.added_at,
          }
        }
        throw err
      }
    })
  )

  return NextResponse.json({ items })
}