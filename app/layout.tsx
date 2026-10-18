import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'GameDrop — PlayStation price alerts',
    template: '%s — GameDrop',
  },
  description: 'Know when PlayStation games reach your target price.',
  authors: [{ name: 'GameDrop' }],
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'GameDrop — PlayStation price alerts',
    description: 'Know when PlayStation games reach your target price.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}