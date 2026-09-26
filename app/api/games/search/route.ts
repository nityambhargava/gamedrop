import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { getPriceProvider, DEFAULT_REGION } from '@/lib/providers/config'

const MAX_QUERY_LENGTH = 100

export async function GET(request: Request) {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    )
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query parameter "q" must be at most ${MAX_QUERY_LENGTH} characters` },
      { status: 400 }
    )
  }

  const provider = getPriceProvider()
  const results = await provider.searchGames(query, DEFAULT_REGION)

  return NextResponse.json({ results })
}