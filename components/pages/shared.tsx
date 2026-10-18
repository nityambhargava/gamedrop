'use client'

import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Bell,
  Check,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Gamepad2,
  House,
  LoaderCircle,
  Search,
  Settings2,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { AppLink, useAppNavigate } from "@/lib/navigation";
import { SHOW_DEMO_BADGE } from "@/lib/api";
import type { WishlistItem, WishlistStatus } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
const gameArt = "/images/game-art-neon.jpg";

export const navItems = [
  { label: "Home", icon: House, to: "/" as const },
  { label: "Wishlist", icon: Gamepad2, to: "/wishlist" as const },
  { label: "Alerts", icon: Bell, to: "/alerts" as const },
  { label: "Settings", icon: Settings2, to: "/settings" as const },
];

export function AppFrame({ children, eyebrow, title, action }: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
        <aside className="sticky top-0 hidden h-screen w-[230px] shrink-0 flex-col border-r border-border/70 px-5 py-7 lg:flex">
          <Brand />
          <nav className="mt-12 space-y-1.5" aria-label="Main navigation">
            {navItems.map(({ label, icon: Icon, to }) => (
              <AppLink key={label} to={to} activeOptions={{ exact: to === "/" }} activeProps={{ className: "bg-secondary text-foreground" }} className="flex h-11 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground">
                <Icon className="size-[18px]" strokeWidth={1.8} />
                {label}
                {label === "Alerts" && <span className="ml-auto size-1.5 rounded-full bg-lime" />}
              </AppLink>
            ))}
          </nav>
          <div className="mt-auto border-t border-border/70 pt-5">
            {SHOW_DEMO_BADGE && <DemoBadge />}
            <p className="mt-4 text-xs text-muted-foreground">Built for patient players.</p>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
            <div className="mx-auto flex h-[68px] max-w-[1060px] items-center justify-between px-4 sm:px-8">
              <div className="lg:hidden"><Brand compact /></div>
              <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <span className="size-1.5 rounded-full bg-lime" />
                PS Store · India
                {SHOW_DEMO_BADGE && <DemoBadge />}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {action}
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-[1060px] px-4 pb-28 pt-8 sm:px-8 sm:pt-10 lg:pb-12">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                {eyebrow && <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>}
                <h1 className="text-[27px] font-semibold leading-tight tracking-[-0.02em] sm:text-3xl">{title}</h1>
              </div>
            </div>
            {children}
          </main>
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Main navigation">
            <div className="mx-auto grid h-[66px] max-w-lg grid-cols-4">
              {navItems.map(({ label, icon: Icon, to }) => (
                <AppLink key={label} to={to} activeOptions={{ exact: to === "/" }} activeProps={{ className: "text-lime" }} className="relative flex flex-col items-center justify-center gap-1.5 text-[10px] text-muted-foreground transition-colors">
                  <Icon className="size-[19px]" strokeWidth={1.8} />
                  <span>{label}</span>
                </AppLink>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <AppLink to="/" className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-md bg-lime text-primary-foreground"><Gamepad2 className="size-[18px]" strokeWidth={2.2} /></span>
      <span className="text-[17px] font-bold tracking-[-0.03em]">GameDrop</span>
      {!compact && <span className="ml-1 rounded border border-border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">PS</span>}
    </AppLink>
  );
}

export function DemoBadge() {
  if (!SHOW_DEMO_BADGE) return null;
  return <span className="inline-flex items-center rounded-sm border border-amber/30 bg-amber/10 px-2 py-1 text-[10px] font-medium leading-none text-amber">Demo prices</span>;
}

export function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || currency === null) return "—";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(amount);
  }
}

export function StatusPill({ status }: { status: WishlistStatus }) {
  const config = {
    TARGET_REACHED: { icon: CircleCheck, text: "Target reached", className: "border-lime/25 bg-success-soft text-lime" },
    ABOVE_TARGET: { icon: ArrowDownRight, text: "Above target", className: "border-amber/25 bg-amber/10 text-amber" },
    UNAVAILABLE: { icon: CircleHelp, text: "Unavailable", className: "border-border bg-secondary text-muted-foreground" },
  }[status];
  const Icon = config.icon;
  return <span className={`inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] font-medium ${config.className}`}><Icon className="size-3" />{config.text}</span>;
}

export function GameArtwork({ title, className = "", compact = false }: { title: string; className?: string; compact?: boolean }) {
  return (
    <div className={`relative isolate overflow-hidden rounded-md bg-secondary ${className}`}>
      <img src={gameArt} alt={`${title} cover artwork placeholder`} width={768} height={1024} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
      {!compact && <span className="absolute bottom-2 left-2 rounded-sm border border-foreground/20 bg-background/50 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-foreground backdrop-blur-sm">PS5</span>}
    </div>
  );
}

export function GameLink({ item, className = "" }: { item: WishlistItem; className?: string }) {
  return <AppLink to="/game/$storeProductId" params={{ storeProductId: item.storeProductId }} className={className}>{item.title}</AppLink>;
}

export function PriceBlock({ item, large = false }: { item: WishlistItem; large?: boolean }) {
  return (
    <div className={large ? "text-right" : "text-right"}>
      <p className={`${large ? "text-[25px] sm:text-[28px]" : "text-[19px]"} font-semibold leading-none tracking-[-0.02em] tabular-nums`}>{formatMoney(item.currentPrice, item.currency)}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">Target <span className="ml-1 font-medium text-foreground">{formatMoney(item.targetPrice, item.currency ?? "INR")}</span></p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Target, title, description, action }: {
  icon?: typeof Target;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center">
    <span className="mb-4 flex size-11 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground"><Icon className="size-5" strokeWidth={1.7} /></span>
    <h3 className="text-sm font-semibold">{title}</h3>
    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>;
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
    <CircleAlert className="mb-3 size-6 text-amber" />
    <p className="text-sm font-medium">We couldn’t load this just now</p>
    <p className="mt-1 max-w-sm text-xs text-muted-foreground">{message}</p>
    <Button className="mt-4" variant="outline" size="sm" onClick={onRetry}><ArrowRight className="size-3.5" /> Try again</Button>
  </div>;
}

export function LoadingRows({ count = 3 }: { count?: number }) {
  return <div className="space-y-3" aria-label="Loading">
    {Array.from({ length: count }, (_, index) => <div key={index} className="flex items-center gap-4 rounded-md border border-border/70 bg-card/50 p-3">
      <Skeleton className="size-[68px] shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
      <Skeleton className="h-7 w-20" />
    </div>)}
  </div>;
}

export function StatTile({ icon: Icon, label, value, detail }: { icon: typeof Gamepad2; label: string; value: string | number; detail: string }) {
  return <div className="flex min-h-[112px] flex-col justify-between rounded-md border border-border/70 bg-card/60 p-4 sm:p-5">
    <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{label}</span><Icon className="size-4 text-muted-foreground" strokeWidth={1.7} /></div>
    <div className="flex items-end justify-between gap-2"><span className="text-2xl font-semibold tabular-nums">{value}</span><span className="pb-1 text-[10px] text-muted-foreground">{detail}</span></div>
  </div>;
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">{title}</h2>{action}</div>;
}

export function FeatureGameRow({ item }: { item: WishlistItem }) {
  return <div className="group flex min-w-0 items-center gap-4 rounded-md border border-border/70 bg-card/65 p-3 transition-colors hover:border-border sm:gap-5 sm:p-4">
    <GameArtwork title={item.title} className="aspect-[0.78] w-[58px] shrink-0 sm:w-[70px]" />
    <div className="min-w-0 flex-1">
      <GameLink item={item} className="block truncate text-sm font-semibold transition-colors hover:text-lime sm:text-[15px]" />
      <p className="mt-1 text-[11px] text-muted-foreground">{item.edition ?? "Standard Edition"} <span className="px-1">·</span> {item.platform}</p>
      <div className="mt-2.5"><StatusPill status={item.status} /></div>
    </div>
    <div className="shrink-0"><PriceBlock item={item} /></div>
    <AppLink to="/game/$storeProductId" params={{ storeProductId: item.storeProductId }} aria-label={`View ${item.title}`} className="hidden size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:flex"><ArrowRight className="size-4" /></AppLink>
  </div>;
}

export function CompactGameRow({ item }: { item: WishlistItem }) {
  const navigate = useAppNavigate();
  return <button onClick={() => navigate({ to: "/game/$storeProductId", params: { storeProductId: item.storeProductId } })} className="flex w-full items-center gap-3 py-3 text-left transition-colors first:pt-0 last:pb-0">
    <GameArtwork title={item.title} compact className="aspect-[0.78] w-11 shrink-0" />
    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{item.title}</span><span className="mt-1 block text-[10px] text-muted-foreground">{item.platform}</span></span>
    <span className="text-xs font-semibold tabular-nums">{formatMoney(item.currentPrice, item.currency)}</span>
  </button>;
}

export function InlineNotice({ children, onDismiss }: { children: ReactNode; onDismiss?: () => void }) {
  return <div className="flex items-start justify-between gap-3 rounded-md border border-amber/20 bg-amber/10 px-3 py-2.5 text-xs text-amber">
    <span className="flex items-start gap-2"><Sparkles className="mt-0.5 size-3.5 shrink-0" />{children}</span>
    {onDismiss && <button aria-label="Dismiss" className="text-amber/75 hover:text-amber" onClick={onDismiss}><X className="size-3.5" /></button>}
  </div>;
}

export function SectionFrame({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`border-t border-border/70 pt-5 ${className}`}><h2 className="mb-3 text-sm font-semibold">{title}</h2>{children}</section>;
}

export function MiniCheck() { return <Check className="size-3.5" />; }
export function TrashIcon() { return <Trash2 className="size-4" />; }
export function Spinner() { return <LoaderCircle className="size-4 animate-spin" />; }
export function SearchIcon() { return <Search className="size-4" />; }