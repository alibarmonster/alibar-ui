"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { LikeButton } from "@/components/ui/like-button/like-button";
import { TiltCard } from "@/components/ui/tilt-card/tilt-card";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/web3/format";

export type NftRarity = "common" | "rare" | "epic" | "legendary";

export interface NftTrait {
  type: string;
  value: string;
  /** Share of the collection with this trait, 0–1. */
  rarity?: number;
}

export interface NftCardProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** The artwork: an <img>, <video>, SVG or any element. It fills a square frame. */
  image: ReactNode;
  /** Token name, e.g. "Lumen Orb #0427". */
  name: string;
  /** Collection name shown above the token name. */
  collection?: string;
  /** Rarity tier shown as a badge on the artwork. */
  rarity?: NftRarity;
  /** Listing price in the smallest unit. Omit for "Not listed". */
  price?: bigint;
  /** Decimals of `price`. @default 18 */
  priceDecimals?: number;
  /** Currency symbol of `price`. @default "ETH" */
  priceSymbol?: string;
  /** Traits revealed over the artwork on hover, focus or the Traits button. */
  traits?: NftTrait[];
  /** Controlled like state. */
  liked?: boolean;
  /** Initial like state when uncontrolled. @default false */
  defaultLiked?: boolean;
  /** Called when the like state changes. */
  onLikedChange?: (liked: boolean) => void;
  /** Like count shown next to the heart. */
  likes?: number;
  /** Link for the token name, e.g. its detail page. */
  href?: string;
  /** Tilt and glare on hover. @default true */
  tilt?: boolean;
  /** Show a skeleton card. @default false */
  loading?: boolean;
}

const RARITY: Record<NftRarity, { label: string; dot: string }> = {
  common: { label: "Common", dot: "bg-zinc-400" },
  rare: { label: "Rare", dot: "bg-primary" },
  epic: { label: "Epic", dot: "bg-violet-500" },
  legendary: { label: "Legendary", dot: "bg-gradient-to-br from-amber-300 to-orange-500" },
};

export function NftCard({
  image,
  name,
  collection,
  rarity,
  price,
  priceDecimals = 18,
  priceSymbol = "ETH",
  traits = [],
  liked,
  defaultLiked,
  onLikedChange,
  likes,
  href,
  tilt = true,
  loading = false,
  className,
  ...props
}: NftCardProps) {
  const [traitsOpen, setTraitsOpen] = useState(false);
  const traitsId = useId();
  const frame = "w-72 rounded-2xl border border-border bg-background p-2 shadow-sm";

  if (loading) {
    return (
      <div role="status" aria-label="Loading NFT" className={cn(frame, className)} {...props}>
        <div className="aspect-square animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
        <div className="space-y-2 px-2 pt-3 pb-2">
          <div className="h-2.5 w-20 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-3.5 w-36 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  const content = (
    <>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted [&>img]:size-full [&>img]:object-cover [&>svg]:size-full">
        {image}
        {rarity ? (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-xs backdrop-blur">
            <span className={cn("size-2 rounded-full", RARITY[rarity].dot)} aria-hidden="true" />
            {RARITY[rarity].label}
          </span>
        ) : null}
        {traits.length > 0 ? (
          <div
            id={traitsId}
            data-open={traitsOpen || undefined}
            className={cn(
              "absolute inset-x-2 bottom-2 grid grid-cols-2 gap-1.5 rounded-xl border border-border/60 bg-background/88 p-2 shadow-sm backdrop-blur-md",
              "translate-y-[calc(100%+12px)] opacity-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              "group-hover/nft:translate-y-0 group-hover/nft:opacity-100 group-focus-within/nft:translate-y-0 group-focus-within/nft:opacity-100",
              "data-[open]:translate-y-0 data-[open]:opacity-100 motion-reduce:translate-y-0",
            )}
          >
            {traits.slice(0, 4).map((trait) => (
              <div key={trait.type} className="min-w-0 rounded-lg bg-surface px-2 py-1.5">
                <p className="truncate text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{trait.type}</p>
                <p className="flex items-baseline justify-between gap-1 text-xs font-medium text-foreground">
                  <span className="truncate">{trait.value}</span>
                  {trait.rarity !== undefined ? (
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums">{Math.round(trait.rarity * 1000) / 10}%</span>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="px-2 pt-3">
        {collection ? <p className="truncate text-xs text-muted-foreground">{collection}</p> : null}
        <p className="truncate text-sm font-semibold text-foreground">
          {href ? (
            <a href={href} className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
              {name}
            </a>
          ) : (
            name
          )}
        </p>
      </div>
      <div className="flex items-end justify-between gap-2 px-2 pt-2 pb-1">
        <div>
          <p className="text-[11px] text-muted-foreground">{price === undefined ? "Status" : "Price"}</p>
          <p className="font-mono text-sm font-medium text-foreground tabular-nums">
            {price === undefined ? "Not listed" : `${formatAmount(price, priceDecimals)} ${priceSymbol}`}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          {traits.length > 0 ? (
            <button
              type="button"
              aria-expanded={traitsOpen}
              aria-controls={traitsId}
              onClick={() => setTraitsOpen(!traitsOpen)}
              className="h-8 cursor-pointer rounded-md px-2 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              Traits
            </button>
          ) : null}
          <LikeButton
            variant="ghost"
            size="sm"
            liked={liked}
            defaultLiked={defaultLiked}
            onLikedChange={onLikedChange}
            count={likes}
            label={`Like ${name}`}
          />
        </div>
      </div>
    </>
  );

  return tilt ? (
    <TiltCard maxTilt={7} glare glareOpacity={0.25} className={cn("group/nft", frame, className)} {...props}>
      {content}
    </TiltCard>
  ) : (
    <div className={cn("group/nft", frame, className)} {...props}>
      {content}
    </div>
  );
}
