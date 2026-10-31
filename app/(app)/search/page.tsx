import type { Metadata } from 'next'
import { SearchPage } from '@/components/pages/SearchPage'

export const metadata: Metadata = { title: 'Find a game' }

export default function Page() {
  return <SearchPage />
}
