import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { createClient } from '@/lib/supabase/server'
import { getPriceProvider } from '@/lib/providers/config'
import { GameNotFoundError } from '@/lib/providers/PriceProvider'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const supabase = await createClient()

  const { data: mapping, error } = await supabase
    .from('game_provider_mapping')
    .select(
      `
      id,
      provider_product_id,
      platform,
      edition,
      region,
      games ( title, artwork_url )
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load store product' },
      { status: 500 }
    )
  }

  if (!mapping) {
    return NextResponse.json({ error: 'Store product not found' }, { status: 404 })
  }

  const provider = getPriceProvider()

  try {
    const currentPrice = await provider.getCurrentPrice(
      mapping.provider_product_id,
      mapping.region
    )

    return NextResponse.json({
      id: mapping.id,
      providerProductId: mapping.provider_product_id,
      title: mapping.games.title,
      platform: mapping.platform,
      edition: mapping.edition,
      region: mapping.region,
      artworkUrl: mapping.games.artwork_url,
      available: true,
      price: {
        currency: currentPrice.currency,
        basePrice: currentPrice.basePrice,
        salePrice: currentPrice.salePrice,
        effectivePrice: currentPrice.effectivePrice,
        discountPercentage: currentPrice.discountPercentage,
        saleExpiresAt: currentPrice.saleExpiresAt,
        observedAt: currentPrice.observedAt,
      },
    })
  } catch (err) {
    if (err instanceof GameNotFoundError) {
      return NextResponse.json({
        id: mapping.id,
        providerProductId: mapping.provider_product_id,
        title: mapping.games.title,
        platform: mapping.platform,
        edition: mapping.edition,
        region: mapping.region,
        artworkUrl: mapping.games.artwork_url,
        available: false,
        price: null,
      })
    }

    throw err
  }
}