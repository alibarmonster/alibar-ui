"use client";

import { useCallback, useImperativeHandle, useMemo, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/utils";
import { GalleryA11y } from "@/lib/gallery/gallery-a11y";
import { GalleryCaption, GalleryControls, chromeScheme } from "@/lib/gallery/gallery-chrome";
import { GalleryFallback } from "@/lib/gallery/gallery-fallback";
import { clamp, smoothstep, wrap } from "@/lib/gallery/math";
import type { GalleryCard } from "@/lib/gallery/renderer";
import type { GalleryHandle, GalleryItem } from "@/lib/gallery/types";
import { useGallery } from "@/lib/gallery/use-gallery";

export type RingReelView = "ring" | "arc";

export interface RingReelHandle extends GalleryHandle {
  /** Zooms between the whole wheel ("ring") and the top of it ("arc"). */
  setView: (view: RingReelView) => void;
}

export interface RingReelProps {
  /** Images on the wheel. They repeat if `count` is larger. */
  items: GalleryItem[];
  /** Content centered inside the ring, e.g. a headline and a call to action. It fades out in arc view. */
  children?: ReactNode;
  /** Cards on the wheel. @default the number of items, up to 16 */
  count?: number;
  /** Card at the top first. @default 0 */
  startIndex?: number;
  /** View on first render. @default "ring" */
  defaultView?: RingReelView;
  /** Ring view turning speed in degrees per second; 0 stops it. @default 6 */
  spin?: number;
  /** In arc view, step the next card to the apex every `interval`. @default true */
  autoplay?: boolean;
  /** Milliseconds between arc view steps. @default 3500 */
  interval?: number;
  /** Hovering brakes the spin and pauses stepping. @default true */
  pauseOnHover?: boolean;
  /** Drag turns the wheel around its center (ring) or sideways (arc), snapping to a card. @default true */
  draggable?: boolean;
  /** One card per wheel notch. @default true */
  wheel?: boolean;
  /** Fraction of the wheel visible in arc view; smaller zooms in further. @default 0.22 */
  arcSize?: number;
  /** Height of the apex card's center in arc view, as a fraction from the top. @default 0.42 */
  apex?: number;
  /** Card width ÷ height. @default 0.72 */
  aspect?: number;
  /** Card corner radius, px. @default 10 */
  radius?: number;
  /** Space between neighbouring cards, px. @default 8 */
  gap?: number;
  /** Lean cards along the wheel; false keeps them upright like Ferris wheel cabins. @default true */
  lean?: boolean;
  /** Cards turn over in a wave from the top when the view changes, and now and then in ring view. @default true */
  flipWave?: boolean;
  /** Color of the card backs shown by the flip wave. @default "#2563EB" */
  accentColor?: string;
  /** Clicking a card in ring view zooms into the arc with that card on top. @default true */
  zoomOnClick?: boolean;
  /** Title and subtitle of the apex card in arc view. @default true */
  captions?: boolean;
  /** Previous and next buttons with a counter in arc view. @default true */
  controls?: boolean;
  /** Background color; captions and controls switch to light text on dark colors. @default "transparent" */
  backgroundColor?: string;
  /** Stops the spin and autoplay (input still works). @default false */
  paused?: boolean;
  /** Highest device pixel ratio rendered. @default 2 */
  dpr?: number;
  /** Accessible name of the reel. @default "Gallery" */
  ariaLabel?: string;
  /** Classes for the root, which fills its parent (at least 420px tall). */
  className?: string;
  /** Inline styles for the root. */
  style?: CSSProperties;
  /** Fires when the card at the top changes, with its position on the wheel. */
  onIndexChange?: (index: number) => void;
  /** Fires when the card at the top changes, with its item. */
  onActiveChange?: (item: GalleryItem, index: number) => void;
  /** Fires on clicking the apex card in arc view, or Enter there. */
  onSelect?: (item: GalleryItem, index: number) => void;
  /** Fires when the view changes. */
  onViewChange?: (view: RingReelView) => void;
  /** Imperative `next()`, `previous()`, `goTo(index)` and `setView(view)`. */
  ref?: Ref<RingReelHandle>;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Parses #rgb, #rrggbb or rgb() into 0–1 channels; anything else falls back to the default blue. */
function toRgb(color: string): [number, number, number] {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
  }
  const rgb = color.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const [r, g, b] = rgb[1].split(/[\s,/]+/).map(parseFloat);
    if ([r, g, b].every(Number.isFinite)) return [r / 255, g / 255, b / 255];
  }
  return [0.145, 0.388, 0.922];
}

/** Wheel layout for a stage size: radius and card size so the ring fits with room to spare. */
function layout(width: number, height: number, slots: number, aspect: number, gap: number) {
  const fit = Math.min(width, height) * 0.47;
  const ratio = clamp(aspect, 0.3, 2);
  const radius = (fit + gap / (2 * ratio)) / (1 + Math.PI / (slots * ratio));
  const step = (Math.PI * 2) / slots;
  const cardWidth = Math.max(8, radius * step - gap);
  return { radius, step, cardWidth, cardHeight: cardWidth / ratio };
}

/**
 * A slowly turning wheel of cards that zooms into an arc at the top. Rendered with the shared
 * WebGL2 gallery engine; a hidden button list carries the accessible gallery.
 */
export function RingReel({
  items,
  children,
  count,
  startIndex = 0,
  defaultView = "ring",
  spin = 6,
  autoplay = true,
  interval = 3500,
  pauseOnHover = true,
  draggable = true,
  wheel = true,
  arcSize = 0.22,
  apex = 0.42,
  aspect = 0.72,
  radius = 10,
  gap = 8,
  lean = true,
  flipWave = true,
  accentColor = "#2563EB",
  zoomOnClick = true,
  captions = true,
  controls = true,
  backgroundColor = "transparent",
  paused = false,
  dpr = 2,
  ariaLabel = "Gallery",
  className,
  style,
  onIndexChange,
  onActiveChange,
  onSelect,
  onViewChange,
  ref,
}: RingReelProps) {
  const slots = Math.max(3, Math.round(count ?? Math.min(items.length, 16)));
  const wheelItems = useMemo(() => Array.from({ length: slots }, (_, i) => items[i % items.length]).filter(Boolean), [items, slots]);
  const [view, setViewState] = useState<RingReelView>(defaultView);
  const back = useMemo(() => toRgb(accentColor), [accentColor]);
  const scheme = chromeScheme(backgroundColor);
  const itemIndex = (slot: number) => wrap(slot, items.length || 1);

  const setView = useCallback(
    (next: RingReelView) => {
      if (next === view) return;
      setViewState(next);
      onViewChange?.(next);
    },
    [view, onViewChange],
  );

  const select = (slot: number) => onSelect?.(items[itemIndex(slot)], itemIndex(slot));

  const { hostRef, bind, status, input, rendererRef } = useGallery({
    images: items.map((item) => item.src),
    count: slots,
    loop: true,
    startIndex,
    draggable,
    wheel,
    // Stepping only happens in arc view; the ring turns by drift instead.
    autoplay: autoplay && view === "arc",
    pausable: spin !== 0,
    interval,
    pauseOnHover,
    paused,
    dpr,
    dragDelta: (move) => {
      const { radius: r, step, cardWidth } = layout(move.width, move.height, slots, aspect, gap);
      if (view === "arc") {
        const arc = clamp(arcSize, 0.05, 0.6) * Math.PI * 2;
        const zoom = clamp((0.95 * move.width) / (2 * r * Math.sin(arc / 2)), 1, 8);
        return -move.dx / Math.max(1, (cardWidth + gap) * zoom);
      }
      // Ring view: the change in the pointer's angle around the wheel center turns the wheel.
      const cx = move.width / 2;
      const cy = move.height / 2;
      const before = Math.atan2(-(move.y - move.dy - cy), move.x - move.dx - cx);
      const after = Math.atan2(-(move.y - cy), move.x - cx);
      let delta = after - before;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      return delta / step;
    },
    onIndexChange: (slot) => {
      onIndexChange?.(slot);
      const item = items[itemIndex(slot)];
      if (item) onActiveChange?.(item, itemIndex(slot));
    },
    onSelect: (slot) => (view === "ring" ? setView("arc") : select(slot)),
    onEscape: () => setView("ring"),
    onTap: (point, gallery) => {
      const hit = rendererRef.current?.pick(point.x, point.y);
      if (!hit) {
        if (view === "arc") setView("ring");
        return;
      }
      if (view === "ring") {
        if (!zoomOnClick) return;
        gallery.goTo(hit.id);
        setView("arc");
      } else if (hit.id === gallery.activeIndex()) select(hit.id);
      else gallery.goTo(hit.id);
    },
    frame: ({ dt, time, width, height, reducedMotion, ambient, memory }, gallery) => {
      if (memory.ambient !== Number(ambient)) {
        memory.ambient = Number(ambient);
        gallery.hold("ambient", !ambient);
      }
      let moving = false;
      // Zoom between ring (0) and arc (1) on a critically damped spring.
      const target = view === "arc" ? 1 : 0;
      memory.zoom ??= target;
      if (reducedMotion) {
        memory.zoom = target;
        memory.zoomV = 0;
      } else {
        const h = Math.min(dt, 1 / 30);
        memory.zoomV = (memory.zoomV ?? 0) + (-64 * (memory.zoom - target) - 16 * (memory.zoomV ?? 0)) * h;
        memory.zoom += memory.zoomV * h;
        if (Math.abs(memory.zoom - target) < 0.0005 && Math.abs(memory.zoomV) < 0.005) {
          memory.zoom = target;
          memory.zoomV = 0;
        } else moving = true;
      }

      // Ring view turns continuously; hover or a drag brakes it.
      const { radius: r, step, cardWidth, cardHeight } = layout(width, height, slots, aspect, gap);
      const drifting = view === "ring" && spin !== 0 && !paused && ambient && !reducedMotion && gallery.canAutoplay();
      const speed = spin / (360 / slots);
      memory.drift = (memory.drift ?? 0) + ((drifting ? speed : 0) - (memory.drift ?? 0)) * (1 - Math.exp(-dt * 2));
      if (!drifting && Math.abs(memory.drift) < 0.001) memory.drift = 0;
      if (memory.drift) {
        gallery.drift(memory.drift * dt);
        moving = true;
      }
      if (gallery.update(dt)) moving = true;

      // Flip wave: on view changes, and every 8–13 s while the ring turns.
      const viewCode = target;
      if (memory.view === undefined) memory.view = viewCode;
      if (memory.wave === undefined) memory.wave = -1;
      if (memory.view !== viewCode) {
        memory.view = viewCode;
        if (flipWave && !reducedMotion) memory.wave = time;
      }
      if (flipWave && drifting) {
        memory.nextWave ??= time + 6 + Math.random() * 4;
        if (time > memory.nextWave) {
          memory.wave = time;
          memory.nextWave = time + 8 + Math.random() * 5;
        }
      }

      const zoomT = smoothstep(0, 1, memory.zoom);
      const arc = clamp(arcSize, 0.05, 0.6) * Math.PI * 2;
      const arcZoom = clamp((0.95 * width) / (2 * r * Math.sin(arc / 2)), 1, 8);
      const zoom = arcZoom ** zoomT;
      const fov = 30;
      const distance = height / 2 / Math.tan((fov * Math.PI) / 360);
      const lookY = zoomT * (r - (0.5 - clamp(apex, 0.1, 0.9)) * (height / zoom));

      const position = gallery.position();
      const cards: GalleryCard[] = [];
      let waving = false;
      for (let slot = 0; slot < slots; slot++) {
        const rel = wrap(slot - position + slots / 2, slots) - slots / 2;
        const theta = Math.PI / 2 - rel * step;
        let flip = 0;
        if (memory.wave >= 0) {
          const f = clamp((time - memory.wave - Math.abs(rel) * 0.07) / 0.8, 0, 1);
          if (f < 1) waving = true;
          flip = f > 0 && f < 1 ? Math.PI * 2 * easeInOut(f) : 0;
        }
        cards.push({
          image: itemIndex(slot),
          id: slot,
          x: r * Math.cos(theta),
          y: r * Math.sin(theta),
          z: 0,
          rotateZ: lean ? theta - Math.PI / 2 : 0,
          flip,
          width: cardWidth,
          height: cardHeight,
          radius: radius,
          shadow: 0.55,
          dim: zoomT * 0.35 * smoothstep(0.6, 3, Math.abs(rel)),
          fill: Math.cos(flip) < 0 ? [back[0], back[1], back[2], 1] : undefined,
        });
      }
      if (waving) moving = true;
      else memory.wave = -1;

      return {
        cards,
        animating: moving,
        scene: {
          fov,
          camera: { y: lookY, targetY: lookY, z: distance / zoom - distance },
          shadowOffset: 6 + zoomT * 8,
          shadowBlur: 12 + zoomT * 10,
          shadowOpacity: 0.22,
          edgeFade: [0.12 * zoomT, 0],
        },
      };
    },
  });

  const { next, previous, goTo } = input;
  useImperativeHandle(ref, () => ({ next, previous, goTo: (index: number) => goTo(index), setView }), [next, previous, goTo, setView]);

  const fallback = status === "fallback";
  const arcView = view === "arc";
  const activeItem = wheelItems[input.index];
  return (
    <div
      ref={bind}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      // Focusable by click (not by Tab) so Escape and arrow keys work after pointer use.
      tabIndex={-1}
      className={cn("relative outline-none size-full min-h-[420px] touch-pan-y rounded-[inherit] select-none [container-type:size] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", className)}
      style={{ backgroundColor, ...style }}
    >
      <div ref={hostRef} className="absolute inset-0">
        {fallback ? <GalleryFallback items={items} label={ariaLabel} aspect={String(aspect)} onSelect={onSelect} className="absolute inset-0" /> : null}
      </div>
      {children && !fallback ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 grid place-items-center transition-[opacity,scale] duration-300 ease-out motion-reduce:transition-none",
            arcView ? "scale-95 opacity-0" : "opacity-100",
          )}
        >
          {/* Sized to the smaller side of the stage so it stays inside the ring's inner circle. */}
          <div data-gallery-control inert={arcView} className={cn("max-w-[54cqmin] text-center", !arcView && "pointer-events-auto")}>
            {children}
          </div>
        </div>
      ) : null}
      {fallback ? null : (
        <GalleryA11y
          items={wheelItems}
          index={input.index}
          label={ariaLabel}
          live={paused || (arcView ? !autoplay : spin === 0)}
          onFocusItem={(slot) => goTo(slot)}
          onActivate={(slot) => {
            if (!arcView) {
              goTo(slot);
              setView("arc");
            } else if (slot === input.index) select(slot);
            else goTo(slot);
          }}
        />
      )}
      {(captions || controls) && !fallback ? (
        <div
          inert={!arcView}
          className={cn(
            "absolute inset-x-0 bottom-0 flex h-14 items-center justify-between gap-3 px-4 transition-opacity duration-300 motion-reduce:transition-none",
            arcView ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {captions ? <GalleryCaption item={activeItem} index={input.index} count={slots} scheme={scheme} className="flex-1" /> : <span />}
          {controls ? <GalleryControls index={input.index} count={slots} onPrevious={previous} onNext={next} scheme={scheme} /> : null}
        </div>
      ) : null}
    </div>
  );
}
