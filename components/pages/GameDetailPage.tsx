'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, CircleAlert, ExternalLink, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ApiError, getStoreProduct, getWishlist, removeFromWishlist } from "@/lib/api";
import { AppLink, useAppNavigate, useAppParams } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  AppFrame,
  GameArtwork,
  LoadError,
  LoadingRows,
  Spinner,
  formatMoney,
} from "@/components/pages/shared";

export function GameDetailPage() {
  const { storeProductId } = useAppParams();
  const queryClient = useQueryClient();
  const navigate = useAppNavigate();

  const productQuery = useQuery({
    queryKey: ["store-product", storeProductId],
    queryFn: () => getStoreProduct(storeProductId),
    enabled: storeProductId.length > 0,
  });

  const wishlistQuery = useQuery({ queryKey: ["wishlist"], queryFn: getWishlist });
  // The wishlist row id is NOT derivable from the store product id.
  // Find this product in the user's own wishlist to get the real id.
  const wishlistItem = wishlistQuery.data?.items.find(
    (item) => item.storeProductId === storeProductId,
  );

  const removeMutation = useMutation({
    mutationFn: (wishlistId: string) => removeFromWishlist(wishlistId),
    onSuccess: () => {
      toast.success("Removed from your wishlist");
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      void navigate({ to: "/wishlist" });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not remove this game"),
  });

  if (productQuery.isPending) {
    return (
      <AppFrame eyebrow="Game" title="Loading…">
        <LoadingRows count={2} />
      </AppFrame>
    );
  }

  if (productQuery.isError) {
    return (
      <AppFrame eyebrow="Game" title="Game details">
        <LoadError
          message={productQuery.error.message}
          onRetry={() => void queryClient.invalidateQueries({ queryKey: ["store-product", storeProductId] })}
        />
      </AppFrame>
    );
  }

  const product = productQuery.data;
  const price = product.price;

  return (
    <AppFrame eyebrow={product.platform} title={product.title}>
      <div className="grid gap-8 sm:grid-cols-[240px_1fr]">
        <GameArtwork title={product.title} className="aspect-[0.78] w-full max-w-[240px]" />

        <div className="space-y-6">
          <AppLink to="/wishlist" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Back to wishlist
          </AppLink>

          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>{product.edition ?? "Standard Edition"}</p>
            <p>Region: {product.region}</p>
          </div>

          {price ? (
            <div className="rounded-md border border-border/70 bg-card/60 p-5">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-semibold tabular-nums tracking-[-0.02em]">
                  {formatMoney(price.effectivePrice, price.currency)}
                </span>
                {price.salePrice !== null && price.salePrice < price.basePrice && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatMoney(price.basePrice, price.currency)}
                    </span>
                    <span className="rounded-sm border border-lime/25 bg-success-soft px-2 py-0.5 text-xs font-medium text-lime">
                      −{price.discountPercentage}%
                    </span>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Last checked {new Date(price.observedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-md border border-border/70 bg-card/60 p-5">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber" />
              <div>
                <p className="text-sm font-medium">Currently unavailable</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This edition isn't listed on the store right now. We'll keep watching and alert you when it's back.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {/* TODO: enable once the API contract includes a storeUrl field. */}
            <Button size="sm" className="gap-1.5" disabled title="Store link coming soon">
              <ExternalLink className="size-3.5" /> Open on PlayStation Store
            </Button>
            <AppLink to="/wishlist">
              <Button size="sm" variant="outline" className="gap-1.5">
                <SlidersHorizontal className="size-3.5" /> Edit target
              </Button>
            </AppLink>
            {wishlistItem && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground hover:text-destructive"
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(wishlistItem.id)}
              >
                {removeMutation.isPending ? <Spinner /> : <Trash2 className="size-3.5" />} Remove
                </Button>
              )}
          </div>

          <div className="flex items-start gap-3 rounded-md border border-border/70 bg-card/50 px-4 py-3.5 text-xs text-muted-foreground">
            <Bell className="mt-0.5 size-4 shrink-0 text-lime" />
            Price alerts are on for this game. Manage your default target and email notifications in{" "}
            <AppLink to="/settings" className="font-medium text-foreground underline-offset-4 hover:underline">Settings</AppLink>.
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
