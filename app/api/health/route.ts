import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const startedAt = Date.now()

  try {
    const supabase = await createClient()

    // A trivial, cheap query — just proves we can reach Postgres.
    // `head: true` means "just tell me if this would succeed," don't
    // actually return row data or count rows.
    const { error } = await supabase
      .from('user_settings')
      .select('user_id', { head: true, count: 'exact' })

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          database: 'unreachable',
          message: error.message,
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      responseTimeMs: Date.now() - startedAt,
    })
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}