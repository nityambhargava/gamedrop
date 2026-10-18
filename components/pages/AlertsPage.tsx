'use client'

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Sparkles } from "lucide-react";

import { getAlerts } from "@/lib/api";
import { AppLink } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { AppFrame, EmptyState, InlineNotice, LoadError, LoadingRows } from "@/components/pages/shared";

export function AlertsPage() {
  const queryClient = useQueryClient();
  const alertsQuery = useQuery({ queryKey: ["alerts"], queryFn: getAlerts });

  return (
    <AppFrame eyebrow="Notifications" title="Alerts">
      <div className="space-y-5">
        <InlineNotice>
          Alerts are a preview of what's coming. Email delivery and full alert history arrive with the live price-tracking service.
        </InlineNotice>

        {alertsQuery.isPending ? (
          <LoadingRows count={2} />
        ) : alertsQuery.isError ? (
          <LoadError
            message={alertsQuery.error.message}
            onRetry={() => void queryClient.invalidateQueries({ queryKey: ["alerts"] })}
          />
        ) : alertsQuery.data.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No alerts yet"
            description="When a tracked game drops to your target price, it will show up here."
            action={
              <AppLink to="/search">
                <Button size="sm">Track a game</Button>
              </AppLink>
            }
          />
        ) : (
          <div className="space-y-3">
            {alertsQuery.data.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 rounded-md border border-lime/25 bg-success-soft px-4 py-3.5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-lime" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-lime">{alert.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{alert.message}</p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {new Date(alert.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppFrame>
  );
}
