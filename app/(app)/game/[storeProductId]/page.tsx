import type { Metadata } from 'next'
import { GameDetailPage } from '@/components/pages/GameDetailPage'

export const metadata: Metadata = { title: 'Game details' }

export default function Page() {
  return <GameDetailPage />
}
