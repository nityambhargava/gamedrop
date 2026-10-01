import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { createClient } from '@/lib/supabase/server'
import { WishlistRepository } from '@/lib/repositories/wishlistRepository'
import { validateCustomTargetPrice } from '@/lib/validation/targetPrice'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('customTargetPrice' in body)
  ) {
    return NextResponse.json(
      { error: 'customTargetPrice is required (pass null to clear it)' },
      { status: 400 }
    )
  }

  const priceValidation = validateCustomTargetPrice(
    (body as { customTargetPrice: unknown }).customTargetPrice
  )

  if (!priceValidation.valid) {
    return NextResponse.json({ error: priceValidation.error }, { status: 400 })
  }

  const supabase = await createClient()
  const wishlistRepository = new WishlistRepository(supabase)

  const updated = await wishlistRepository.updateCustomTargetPrice(
    id,
    user.id,
    priceValidation.value
  )

  if (!updated) {
    return NextResponse.json({ error: 'Wishlist entry not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: updated.id,
    customTargetPrice: updated.custom_target_price,
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const supabase = await createClient()
  const wishlistRepository = new WishlistRepository(supabase)

  const deleted = await wishlistRepository.delete(id, user.id)

  if (!deleted) {
    return NextResponse.json({ error: 'Wishlist entry not found' }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}