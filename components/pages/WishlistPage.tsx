'use client'

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, Gamepad2, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { ApiError, getWishlist, removeFromWishlist, updateWishlistTarget } from "@/lib/api";
import { AppLink } from "@/lib/navigation";
import type { WishlistItem, WishlistStatus } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AppFrame,
  EmptyState,
  FeatureGameRow,
  LoadError,
  LoadingRows,
  Spinner,
  TrashIcon,
  formatMoney,
} from "@/components/pages/shared";

type StatusFilter = "ALL" | WishlistStatus;
type SortKey = "added" | "price" | "target";

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "TARGET_REACHED", label: "Target reached" },
  { value: "ABOVE_TARGET", label: "Above target" },
  { value: "UNAVAILABLE", label: "Unavailable" },
];

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "added", label: "Recently added" },
  { value: "price", label: "Lowest price" },
  { value: "target", label: "Closest to target" },
];

export function WishlistPage() {
  const queryClient = useQueryClient();
  const wishlistQuery = useQuery({ queryKey: ["wishlist"], queryFn: getWishlist });
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortKey>("added");
  const [editing, setEditing] = useState<WishlistItem | null>(null);
  const [removing, setRemoving] = useState<WishlistItem | null>(null);

  const items = useMemo(() => {
    const all = wishlistQuery.data?.items ?? [];
    const filtered = filter === "ALL" ? all : all.filter((item) => item.status === filter);
    return [...filtered].sort((a, b) => {
      if (sort === "added") return b.addedAt.localeCompare(a.addedAt);
      if (sort === "price") return (a.currentPrice ?? Number.POSITIVE_INFINITY) - (b.currentPrice ?? Number.POSITIVE_INFINITY);
      const ratio = (item: WishlistItem) =>
        item.currentPrice === null ? Number.POSITIVE_INFINITY : item.currentPrice - item.targetPrice;
      return ratio(a) - ratio(b);
    });
  }, [wishlistQuery.data, filter, sort]);

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFromWishlist(id),
    onSuccess: () => {
      toast.success("Removed from your wishlist");
      setRemoving(null);
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not remove this game"),
  });

  return (
    <AppFrame
      eyebrow="Library"
      title="Wishlist"
      action={
        <AppLink to="/search">
          <Button size="sm" className="gap-1.5">
            <Search className="size-3.5" /> Add a game
          </Button>
        </AppLink>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-sm border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                filter === option.value
                  ? "border-lime/40 bg-success-soft text-lime"
                  : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowUpDown className="size-3.5" />
          <select
            aria-label="Sort wishlist"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="rounded-sm border border-border bg-card px-2 py-1.5 text-xs text-foreground"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {wishlistQuery.isPending ? (
        <LoadingRows count={4} />
      ) : wishlistQuery.isError ? (
        <LoadError
          message={wishlistQuery.error.message}
          onRetry={() => void queryClient.invalidateQueries({ queryKey: ["wishlist"] })}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title={filter === "ALL" ? "Your wishlist is empty" : "Nothing matches this filter"}
          description={
            filter === "ALL"
              ? "Search for a PlayStation game and set a target price to start tracking it."
              : "Try a different status filter to see the rest of your list."
          }
          action={
            filter === "ALL" ? (
              <AppLink to="/search">
                <Button size="sm">Search games</Button>
              </AppLink>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setFilter("ALL")}>Show all</Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <FeatureGameRow item={item} />
              <div className="mt-1.5 flex justify-end gap-1.5">
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={() => setEditing(item)}>
                  <SlidersHorizontal className="size-3.5" /> Edit target
                </Button>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive" onClick={() => setRemoving(item)}>
                  <TrashIcon /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditTargetDialog key={editing?.id ?? "closed"} item={editing} onClose={() => setEditing(null)} />

      <Dialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removing?.title}?</DialogTitle>
            <DialogDescription>
              You'll stop getting price alerts for this game. You can always add it back from search.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>Keep it</Button>
            <Button
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={() => removing && removeMutation.mutate(removing.id)}
            >
              {removeMutation.isPending ? <Spinner /> : null} Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppFrame>
  );
}

function EditTargetDialog({ item, onClose }: { item: WishlistItem | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(item ? String(item.targetPrice) : "");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ id, target }: { id: string; target: number | null }) => updateWishlistTarget(id, target),
    onSuccess: (_data, variables) => {
      toast.success(variables.target === null ? "Target reset to your default" : "Target price updated");
      close();
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not update the target price"),
  });

  const close = () => {
    setValue("");
    setError(null);
    onClose();
  };

  const submit = () => {
    if (!item) return;
    const parsed = Number(value);
    if (!value.trim() || !Number.isFinite(parsed)) {
      setError("Enter a valid number");
      return;
    }
    mutation.mutate({ id: item.id, target: parsed });
  };

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (open && item) setValue(String(item.targetPrice));
        if (!open) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Target price for {item?.title}</DialogTitle>
          <DialogDescription>
            Current price: {formatMoney(item?.currentPrice ?? null, item?.currency ?? null)}. We'll alert you when it drops to your target.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="e.g. 1500"
            aria-label="Target price"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            className="text-muted-foreground"
            disabled={mutation.isPending}
            onClick={() => item && mutation.mutate({ id: item.id, target: null })}
          >
            Reset to default
          </Button>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending ? <Spinner /> : null} Save target
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
