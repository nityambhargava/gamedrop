'use client'

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, getSettings, updateSettings } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AppFrame, LoadError, LoadingRows, Spinner, formatMoney } from "@/components/pages/shared";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: ["settings"], queryFn: getSettings });

  const [targetInput, setTargetInput] = useState("");
  const [targetError, setTargetError] = useState<string | null>(null);

  useEffect(() => {
    if (settingsQuery.data) setTargetInput(String(settingsQuery.data.defaultTargetPrice));
  }, [settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      toast.success("Settings saved");
      setTargetError(null);
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Could not save settings";
      setTargetError(message);
      toast.error(message);
    },
  });

  const saveTarget = () => {
    const parsed = Number(targetInput);
    if (!targetInput.trim() || !Number.isFinite(parsed)) {
      setTargetError("Enter a valid number");
      return;
    }
    if (parsed < 0) {
      setTargetError("Target price can't be negative");
      return;
    }
    mutation.mutate({ defaultTargetPrice: parsed });
  };

  if (settingsQuery.isPending) {
    return (
      <AppFrame eyebrow="Preferences" title="Settings">
        <LoadingRows count={2} />
      </AppFrame>
    );
  }

  if (settingsQuery.isError) {
    return (
      <AppFrame eyebrow="Preferences" title="Settings">
        <LoadError
          message={settingsQuery.error.message}
          onRetry={() => void queryClient.invalidateQueries({ queryKey: ["settings"] })}
        />
      </AppFrame>
    );
  }

  const settings = settingsQuery.data;

  return (
    <AppFrame eyebrow="Preferences" title="Settings">
      <div className="max-w-xl space-y-6">
        <section className="rounded-md border border-border/70 bg-card/60 p-5">
          <h2 className="text-sm font-semibold">Default target price</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Every game you add starts with this target. You can override it per game from the wishlist.
          </p>
          <div className="mt-4 flex items-start gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="default-target" className="sr-only">Default target price</Label>
              <Input
                id="default-target"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={targetInput}
                onChange={(event) => setTargetInput(event.target.value)}
              />
              {targetError
                ? <p className="text-xs text-destructive">{targetError}</p>
                : <p className="text-xs text-muted-foreground">Currently {formatMoney(settings.defaultTargetPrice, settings.currency)}</p>}
            </div>
            <Button size="sm" disabled={mutation.isPending} onClick={saveTarget}>
              {mutation.isPending ? <Spinner /> : null} Save
            </Button>
          </div>
        </section>

        <section className="rounded-md border border-border/70 bg-card/60 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Email notifications</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Get an email when a tracked game reaches your target price.
              </p>
            </div>
            <Switch
              checked={settings.emailNotificationsEnabled}
              onCheckedChange={(checked) => mutation.mutate({ emailNotificationsEnabled: checked })}
              disabled={mutation.isPending}
              aria-label="Email notifications"
            />
          </div>
        </section>

        <section className="rounded-md border border-border/70 bg-card/60 p-5">
          <h2 className="text-sm font-semibold">Region</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Prices are shown for the PlayStation Store {settings.region} region in {settings.currency}. Region switching arrives with the live service.
          </p>
        </section>
      </div>
    </AppFrame>
  );
}
