"use client";

import { useImperativeHandle, type CSSProperties, type Ref } from "react";
import { cn } from "@/lib/utils";
import { GalleryA11y } from "@/lib/gallery/gallery-a11y";
import { GalleryCaption, GalleryControls, chromeScheme } from "@/lib/gallery/gallery-chrome";
import { GalleryFallback } from "@/lib/gallery/gallery-fallback";
import { clamp, smoothstep } from "@/lib/gallery/math";
import type { GalleryCard } from "@/lib/gallery/renderer";
import type { GalleryHandle, GalleryItem } from "@/lib/gallery/types";
import { useGallery } from "@/lib/gallery/use-gallery";

export interface HelixGalleryProps {
  /** Images wound on the helix, top to bottom. */
  items: GalleryItem[];
  /** Card facing the viewer first. @default 0 */
  startIndex?: number;
  /** Travel to the next card every `interval`. @default false */
  autoplay?: boolean;
  /** Milliseconds between autoplay steps. @default 3500 */
  interval?: number;
  /** Pause autoplay while hovered. @default true */
  pauseOnHover?: boolean;
  /** Drag up and down to travel along the helix. @default true */
  draggable?: boolean;
  /** One card per wheel notch (the page scrolls on at either end). @default true */
  wheel?: boolean;
  /** Title and subtitle of the card facing the viewer. @default true */
  captions?: boolean;
  /** Previous and next buttons with a counter. @default true */
  controls?: boolean;
  /** Cards per full turn of the helix. @default 8 */
  perTurn?: number;
  /** Helix radius as a fraction of the stage width. @default 0.32 */
  radius?: number;
  /** Vertical rise between neighbouring cards, as a fraction of the card height. @default 0.42 */
  rise?: number;
  /** Card height as a fraction of the stage height. @default 0.42 */
  size?: number;
  /** Card width ÷ height. @default 0.78 */
  aspect?: number;
  /** Card corner radius, px. @default 12 */
  cardRadius?: number;
  /** How much cards on the far side darken, 0–1. @default 0.55 */
  dim?: number;
  /** Background color; captions and controls switch to light text on dark colors. @default "transparent" */
  backgroundColor?: string;
  /** Stops autoplay (input still works). @default false */
  paused?: boolean;
  /** Highest device pixel ratio rendered. @default 2 */
  dpr?: number;
  /** Accessible name of the gallery. @default "Gallery" */
  ariaLabel?: string;
  /** Classes for the root, which fills its parent (at least 420px tall). */
  className?: string;
  /** Inline styles for the root. */
  style?: CSSProperties;
  /** Fires when the card facing the viewer changes. */
  onIndexChange?: (index: number) => void;
  /** Fires on clicking the front card or pressing Enter. */
  onSelect?: (item: GalleryItem, index: number) => void;
  /** Imperative `next()`, `previous()` and `goTo(index)`. */
  ref?: Ref<GalleryHandle>;
}

const CHROME = 56;

/**
 * Cards wound on a vertical helix. Scrolling or dragging travels along it and the active card turns
 * to face the viewer. Rendered with the shared WebGL2 gallery engine.
 */
export function HelixGallery({
  items,
  startIndex = 0,
  autoplay = false,
  interval = 3500,
  pauseOnHover = true,
  draggable = true,
  wheel = true,
  captions = true,
  controls = true,
  perTurn = 8,
  radius = 0.32,
  rise = 0.42,
  size = 0.42,
  aspect = 0.78,
  cardRadius = 12,
  dim = 0.55,
  backgroundColor = "transparent",
  paused = false,
  dpr = 2,
  ariaLabel = "Gallery",
  className,
  style,
  onIndexChange,
  onSelect,
  ref,
}: HelixGalleryProps) {
  const count = items.length;
  const chrome = captions || controls ? CHROME : 0;
  const metrics = (width: number, height: number) => {
    const cardHeight = Math.min(clamp(size, 0.15, 0.8) * height, (width * 0.36) / clamp(aspect, 0.3, 3));
    return { cardHeight, cardWidth: cardHeight * clamp(aspect, 0.3, 3), lift: cardHeight * clamp(rise, 0.1, 1.5), helix: clamp(radius, 0.1, 0.6) * width };
  };

  const { hostRef, bind, status, input, rendererRef } = useGallery({
    images: items.map((item) => item.src),
    count,
    startIndex,
    draggable,
    wheel,
    autoplay,
    interval,
    pauseOnHover,
    paused,
    dpr,
    axis: "y",
    // Dragging up travels down the helix: one card per card rise.
    dragDistance: (width, height) => metrics(width, height - chrome).lift,
    onIndexChange,
    onSelect: (index) => onSelect?.(items[index], index),
    onTap: (point, gallery) => {
      const hit = rendererRef.current?.pick(point.x, point.y);
      if (!hit) return;
      if (hit.id === gallery.activeIndex()) onSelect?.(items[hit.id], hit.id);
      else gallery.goTo(hit.id);
    },
    frame: ({ dt, width, height, ambient, memory }, gallery) => {
      if (memory.ambient !== Number(ambient)) {
        memory.ambient = Number(ambient);
        gallery.hold("ambient", !ambient);
      }
      const moving = gallery.update(dt);
      const position = gallery.position();
      const { cardHeight, cardWidth, lift, helix } = metrics(width, height);
      const step = (Math.PI * 2) / clamp(Math.round(perTurn), 3, 24);
      const cards: GalleryCard[] = [];
      for (let i = 0; i < count; i++) {
        const offset = i - position;
        if (Math.abs(offset) > perTurn * 0.75) continue;
        const theta = offset * step;
        const facing = Math.cos(theta);
        cards.push({
          image: i,
          id: i,
          x: Math.sin(theta) * helix,
          y: -offset * lift,
          z: (facing - 1) * helix,
          rotateY: theta,
          width: cardWidth,
          height: cardHeight,
          radius: cardRadius,
          dim: clamp(dim, 0, 1) * (1 - smoothstep(-0.2, 1, facing)),
          opacity: 1 - smoothstep(perTurn * 0.5, perTurn * 0.75, Math.abs(offset)),
          shadow: 0.5 * smoothstep(0, 1, facing),
        });
      }
      return { cards, animating: moving, scene: { fov: 32, edgeFade: [0, 0.14], shadowOffset: 10, shadowBlur: 18, shadowOpacity: 0.22 } };
    },
  });

  const { next, previous, goTo } = input;
  useImperativeHandle(ref, () => ({ next, previous, goTo: (index: number) => goTo(index) }), [next, previous, goTo]);

  const scheme = chromeScheme(backgroundColor);
  const fallback = status === "fallback";
  return (
    <div
      ref={bind}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={-1}
      className={cn("relative flex size-full min-h-[420px] touch-pan-x flex-col rounded-[inherit] outline-none select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", className)}
      style={{ backgroundColor, ...style }}
    >
      <div ref={hostRef} className="relative min-h-0 flex-1">
        {fallback ? <GalleryFallback items={items} label={ariaLabel} aspect={String(aspect)} onSelect={onSelect} className="absolute inset-0" /> : null}
      </div>
      {fallback ? null : (
        <GalleryA11y items={items} index={input.index} label={ariaLabel} live={!autoplay || paused} onFocusItem={(i) => goTo(i)} onActivate={(i) => (i === input.index ? onSelect?.(items[i], i) : goTo(i))} />
      )}
      {chrome && !fallback ? (
        <div className="flex shrink-0 items-center justify-between gap-3 px-4" style={{ height: CHROME }}>
          {captions ? <GalleryCaption item={items[input.index]} index={input.index} count={count} scheme={scheme} className="flex-1" /> : <span />}
          {controls ? <GalleryControls index={input.index} count={count} onPrevious={previous} onNext={next} scheme={scheme} bounded /> : null}
        </div>
      ) : null}
    </div>
  );
}
