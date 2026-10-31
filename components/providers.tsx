'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from '@/lib/api'
import { Toaster } from '@/components/ui/sonner'

function shouldRetry(failureCount: number, error: unknown): boolean {
  // A 4xx means the server understood and said no (not found, invalid input).
  // Repeating the request can't change the answer, so fail fast.
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < 2
}

export function Providers({ children }: { children: ReactNode }) {
  // One QueryClient per browser session, created once.
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: shouldRetry } } })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}