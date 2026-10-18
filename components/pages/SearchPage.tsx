'use client'

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { ApiError, addToWishlist, getSettings, getWishlist, searchGames } from "@/lib/api";
import { AppLink, useAppNavigate } from "@/lib/navigation";
import type { SearchResult } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AppFrame,
  EmptyState,
  GameArtwork,
  InlineNotice,
  Spinner,
  formatMoney,
} from "@/components/pages/shared";

export function SearchPage() {
  const queryClient = useQueryClient();
  const navigate = useAppNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [conflict, setConflict] = useState<{ title: string; wishlistId: string } | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const settingsQuery = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const wishlistQuery = useQuery({ queryKey: ["wishlist"], queryFn: getWishlist });
  const searchQuery = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchGames(debounced),
    enabled: debounced.length > 0,
  });

  const wishlistIds = useMemo(
    () => new Set((wishlistQuery.data?.items ?? []).map((item) => item.providerProductId)),
    [wishlistQuery.data],
  );

  const addMutation = useMutation({
    mutationFn: (result: SearchResult) => addToWishlist(result.providerProductId),
    onSuccess: (item) => {
      toast.success(`${item.title} added to your wishlist`);
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      void navigate({ to: "/game/$storeProductId", params: { storeProductId: item.storeProductId } });
    },
    onError: (error, result) => {
      if (error instanceof ApiError && error.status === 409 && error.existingWishlistId) {
        setConflict({ title: result.title, wishlistId: error.existingWishlistId });
      } else {
        toast.error(error instanceof ApiError ? error.message : "Could not add this game");
      }
    },
  });

  const defaultTarget = settingsQuery.data?.defaultTargetPrice;
  const currency = settingsQuery.data?.currency ?? "INR";
  const results = searchQuery.data?.results ?? [];

  return (
    <AppFrame eyebrow="Discover" title="Find a game">
      <div className="space-y-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search PlayStation games…"
            aria-label="Search games"
            className="h-12 rounded-md pl-10 text-[15px]"
            autoFocus
          />
        </div>

        {defaultTarget !== undefined && (
          <p className="text-xs text-muted-foreground">
            New games are tracked with your default target of {formatMoney(defaultTarget, currency)}.
          </p>
        )}

        {conflict && (
          <InlineNotice onDismiss={() => setConflict(null)}>
            <span>
              {conflict.title} is already in your wishlist.{" "}
              <AppLink to="/wishlist" className="font-medium underline underline-offset-2">Open wishlist</AppLink>
            </span>
          </InlineNotice>
        )}

        {debounced.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Search the PlayStation catalog"
            description="Type a game title and add it to your wishlist with one tap. We'll watch the price from there."
          />
        ) : searchQuery.isPending ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Spinner /> Searching…
          </div>
        ) : searchQuery.isError ? (
          <EmptyState
            icon={Search}
            title="Search didn't work"
            description={searchQuery.error.message}
            action={<Button size="sm" variant="outline" onClick={() => void searchQuery.refetch()}>Try again</Button>}
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={Search}
            title={`No matches for “${debounced}”`}
            description="Check the spelling, or try a shorter title."
          />
        ) : (
          <div className="space-y-2.5">
            {results.map((result) => {
              const alreadyAdded = wishlistIds.has(result.providerProductId);
              return (
                <div key={result.providerProductId} className="flex items-center gap-4 rounded-md border border-border/70 bg-card/60 p-3">
                  <GameArtwork title={result.title} compact className="aspect-[0.78] w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{result.title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{result.platform}</p>
                  </div>
                  {alreadyAdded ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-lime">
                      <CircleCheck className="size-4" /> In wishlist
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={addMutation.isPending}
                      onClick={() => addMutation.mutate(result)}
                    >
                      {addMutation.isPending && addMutation.variables?.providerProductId === result.providerProductId
                        ? <Spinner />
                        : <Plus className="size-3.5" />}
                      Track
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppFrame>
  );
}
