'use client'

import { useCallback, type ComponentProps } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'

type RouteParams = Record<string, string>

// "/game/$storeProductId" + { storeProductId: "abc" } -> "/game/abc"
function resolveHref(to: string, params?: RouteParams): string {
  if (!params) return to
  return to.replace(/\$(\w+)/g, (_match, key: string) =>
    encodeURIComponent(params[key] ?? '')
  )
}

type AppLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  to: string
  params?: RouteParams
  activeOptions?: { exact?: boolean }
  activeProps?: { className?: string }
}

export function AppLink({
  to,
  params,
  activeOptions,
  activeProps,
  className,
  ...rest
}: AppLinkProps) {
  const pathname = usePathname()
  const href = resolveHref(to, params)

  // "/" would prefix-match every page, so it is always an exact match.
  const exact = activeOptions?.exact || href === '/'
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)

  const mergedClassName = [className, isActive ? activeProps?.className : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <Link
      href={href}
      className={mergedClassName || undefined}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
    />
  )
}

export function useAppNavigate() {
  const router = useRouter()

  return useCallback(
    (options: { to: string; params?: RouteParams }) => {
      router.push(resolveHref(options.to, options.params))
    },
    [router]
  )
}

export function useAppParams() {
  const params = useParams<{ storeProductId?: string }>()
  return { storeProductId: params.storeProductId ?? '' }
}