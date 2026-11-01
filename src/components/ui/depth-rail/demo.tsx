"use client";

import { useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { galleryImages } from "@/components/site/gallery-images";
import { DepthRail } from "@/components/ui/depth-rail/depth-rail";
import { RollingDigits } from "@/components/ui/rolling-digits/rolling-digits";
import { cn } from "@/lib/utils";

const prints = galleryImages.slice(0, 9).map((image, i) => ({
  id: image.src,
  title: image.title,
  subtitle: image.subtitle,
  meta: `Edition of ${40 + i * 15}`,
  image: image.src,
  alt: image.alt,
  saves: 1200 + i * 431,
  price: 48 + i * 6,
}));

export function Collection() {
  return <DepthRail items={prints} label="Print collection" defaultIndex={3} />;
}

export function WithStats() {
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  return (
    <DepthRail
      items={prints}
      label="Prints with stats"
      defaultIndex={2}
      renderCaption={(item) => {
        const isSaved = Boolean(saved[item.id]);
        return (
          <div className="flex items-center justify-center gap-4">
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-[13px] text-muted-foreground tabular-nums">
                <RollingDigits value={item.saves + (isSaved ? 1 : 0)} /> saves · $<RollingDigits value={item.price} />
              </p>
            </div>
            <button
              type="button"
              aria-pressed={isSaved}
              aria-label={isSaved ? `Unsave ${item.title}` : `Save ${item.title}`}
              onClick={() => setSaved((current) => ({ ...current, [item.id]: !isSaved }))}
              className={cn(
                "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSaved ? "border-transparent bg-foreground text-background" : "border-border text-foreground hover:bg-surface-2",
              )}
            >
              <Bookmark className={cn("size-4", isSaved && "fill-current")} aria-hidden="true" />
            </button>
          </div>
        );
      }}
    />
  );
}

export function Controlled() {
  const [index, setIndex] = useState(0);
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <DepthRail items={prints.slice(0, 7)} label="Controlled prints" index={index} onIndexChange={setIndex} />
      <div className="flex items-center gap-2 text-sm">
        <button type="button" aria-label="Previous print" onClick={() => setIndex((i) => Math.max(0, i - 1))} className="grid size-9 cursor-pointer place-items-center rounded-full border border-border hover:bg-surface-2">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="min-w-16 text-center font-mono text-[13px] text-muted-foreground tabular-nums">index {index}</span>
        <button type="button" aria-label="Next print" onClick={() => setIndex((i) => Math.min(6, i + 1))} className="grid size-9 cursor-pointer place-items-center rounded-full border border-border hover:bg-surface-2">
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
