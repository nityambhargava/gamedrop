'use client'

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Gamepad2, Search, Sparkles, Target, TrendingDown } from "lucide-react";

import { getAlerts, getSettings, getWishlist } from "@/lib/api";
import { AppLink } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  AppFrame,
  CompactGameRow,
  EmptyState,
  FeatureGameRow,
  LoadError,
  LoadingRows,
  SectionFrame,
  SectionHeading,
  StatTile,
  formatMoney,
} from "@/components/pages/shared";

export function HomePage() {
  const queryClient = useQueryClient();
  const wishlistQuery = useQuery({ queryKey: ["wishlist"], queryFn: getWishlist });
  const settingsQuery = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const alertsQuery = useQuery({ queryKey: ["alerts"], queryFn: getAlerts });

  const retryAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    void queryClient.invalidateQueries({ queryKey: ["settings"] });
    void queryClient.invalidateQueries({ queryKey: ["alerts"] });
  };

  if (wishlistQuery.isPending || settingsQuery.isPending) {
    return (
      <AppFrame eyebrow="Overview" title="Your price watch">
        <LoadingRows />
      </AppFrame>
    );
  }

  if (wishlistQuery.isError || settingsQuery.isError) {
    const message = (wishlistQuery.error ?? settingsQuery.error)?.message ?? "Unknown error";
    return (
      <AppFrame eyebrow="Overview" title="Your price watch">
        <LoadError message={message} onRetry={retryAll} />
      </AppFrame>
    );
  }

  const items = wishlistQuery.data.items;
  const settings = settingsQuery.data;
  const alerts = alertsQuery.data ?? [];
  const latestAlert = alerts[0];
  const reached = items.filter((item) => item.status === "TARGET_REACHED");
  const watching = items.filter((item) => item.status === "ABOVE_TARGET");
  const featured = reached.length > 0 ? reached : items.slice(0, 3);
  const recent = [...items].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 4);

  return (
    <AppFrame
      eyebrow="Overview"
      title="Your price watch"
      action={
        <AppLink to="/search">
          <Button size="sm" className="gap-1.5">
            <Search className="size-3.5" /> Add a game
          </Button>
        </AppLink>
      }
    >
      <div className="space-y-8">
        {latestAlert && (
          <div className="flex items-start gap-3 rounded-md border border-lime/25 bg-success-soft px-4 py-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-lime" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-lime">{latestAlert.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{latestAlert.message}</p>
            </div>
            <AppLink to="/alerts" className="shrink-0 text-xs font-medium text-lime underline-offset-4 hover:underline">
              View alerts
            </AppLink>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={Gamepad2} label="Tracking" value={items.length} detail="games" />
          <StatTile icon={Target} label="At target" value={reached.length} detail="ready to buy" />
          <StatTile icon={TrendingDown} label="Watching" value={watching.length} detail="above target" />
          <StatTile icon={Bell} label="Alerts" value={alerts.length} detail={settings.emailNotificationsEnabled ? "email on" : "email off"} />
        </div>

        <SectionFrame title={reached.length > 0 ? "Reached your target" : "Featured in your list"}>
          {items.length === 0 ? (
            <EmptyState
              icon={Gamepad2}
              title="No games tracked yet"
              description="Search for a PlayStation game and set a target price. We'll watch the store so you don't have to."
              action={
                <AppLink to="/search">
                  <Button size="sm">Search games</Button>
                </AppLink>
              }
            />
          ) : (
            <div className="space-y-3">
              {featured.slice(0, 3).map((item) => (
                <FeatureGameRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </SectionFrame>

        {recent.length > 0 && (
          <SectionFrame title="Recently added">
            <div className="rounded-md border border-border/70 bg-card/50 px-4">
              {recent.map((item) => (
                <CompactGameRow key={item.id} item={item} />
              ))}
            </div>
          </SectionFrame>
        )}

        <SectionFrame title="Defaults">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border/70 bg-card/50 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium">Default target price</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                New games start with a target of {formatMoney(settings.defaultTargetPrice, settings.currency)}.
              </p>
            </div>
            <AppLink to="/settings">
              <Button variant="outline" size="sm">Adjust in settings</Button>
            </AppLink>
          </div>
        </SectionFrame>

        <div className="flex justify-end">
          <SectionHeading title="" action={
            <AppLink to="/wishlist" className="text-xs font-medium text-lime underline-offset-4 hover:underline">
              Open full wishlist
            </AppLink>
          } />
        </div>
      </div>
    </AppFrame>
  );
}
