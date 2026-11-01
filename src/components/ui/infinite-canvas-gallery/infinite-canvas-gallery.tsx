"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type KeyboardEvent, type Ref } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, X } from "lucide-react";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { GalleryA11y } from "@/lib/gallery/gallery-a11y";
import { chromeScheme } from "@/lib/gallery/gallery-chrome";
import { GalleryFallback } from "@/lib/gallery/gallery-fallback";
import { clamp, lerp, smoothstep, wrap } from "@/lib/gallery/math";
import type { GalleryCard } from "@/lib/gallery/renderer";
import type { GalleryHandle, GalleryItem } from "@/lib/gallery/types";
import { useGallery } from "@/lib/gallery/use-gallery";

export interface InfiniteCanvasHandle extends GalleryHandle {
  /** Pans by a number of cells (keyboard-sized steps). */
  pan: (columns: number, rows: number) => void;
  /** Closes the open image. */
  close: () => void;
}

export interface InfiniteCanvasGalleryProps {
  /** Images; they tile endlessly in every direction. */
  items: GalleryItem[];
  /** Item the keyboard list starts on. @default 0 */
  startIndex?: number;
  /** Drift slowly on its own until touched. @default false */
  autoplay?: boolean;
  /** Drift speed in px per second when autoplay is on. @default 18 */
  interval?: number;
  /** Pause the drift while hovered. @default true */
  pauseOnHover?: boolean;
  /** Drag to pan in any direction, with momentum. @default true */
  draggable?: boolean;
  /** The wheel and trackpad pan the canvas (they then stop the page scrolling over it). @default false */
  wheel?: boolean;
  /** Caption and close button under an open image. @default true */
  captions?: boolean;
  /** Arrow buttons that pan one cell at a time. @default true */
  controls?: boolean;
  /** Column width in px; 0 sizes it to the stage. @default 0 */
  cellSize?: number;
  /** Space between cards, as a fraction of the column width. @default 0.08 */
  gap?: number;
  /** Depth difference between columns, 0–0.5: near columns move faster and look larger. @default 0.18 */
  depth?: number;
  /** Card corner radius, px. @default 10 */
  radius?: number;
  /** Seed for the column layout. @default 3 */
  seed?: number;
  /** Background color; captions and controls switch to light text on dark colors. @default "transparent" */
  backgroundColor?: string;
  /** Stops the drift (input still works). @default false */
  paused?: boolean;
  /** Highest device pixel ratio rendered. @default 2 */
  dpr?: number;
  /** Accessible name of the gallery. @default "Gallery" */
  ariaLabel?: string;
  /** Classes for the root, which fills its parent (at least 420px tall). */
  className?: string;
  /** Inline styles for the root. */
  style?: CSSProperties;
  /** Fires when the keyboard list's active item changes. */
  onIndexChange?: (index: number) => void;
  /** Fires when an image opens. */
  onSelect?: (item: GalleryItem, index: number) => void;
  /** Imperative `next()`, `previous()`, `goTo()`, `pan(columns, rows)` and `close()`. */
  ref?: Ref<InfiniteCanvasHandle>;
}

const ROWS = 6;
const DEPTH_CYCLE = 5;

/** Deterministic 0–1 hash of two integers and a seed. */
function hash(a: number, b: number, seed: number) {
  let h = Math.imul(a + 0x9e37, 374761393) ^ Math.imul(b + 0x85eb, 668265263) ^ Math.imul(seed + 1, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

type OpenState = { id: number; item: number } | null;

/**
 * An endless, pannable masonry grid. Columns sit at slightly different depths, so they slide past
 * each other with parallax; momentum carries a throw. Click an image to open it. Rendered with the
 * shared WebGL2 gallery engine.
 */
export function InfiniteCanvasGallery({
  items,
  startIndex = 0,
  autoplay = false,
  interval = 18,
  pauseOnHover = true,
  draggable = true,
  wheel = false,
  captions = true,
  controls = true,
  cellSize = 0,
  gap = 0.08,
  depth = 0.18,
  radius = 10,
  seed = 3,
  backgroundColor = "transparent",
  paused = false,
  dpr = 2,
  ariaLabel = "Gallery",
  className,
  style,
  onIndexChange,
  onSelect,
  ref,
}: InfiniteCanvasGalleryProps) {
  const [open, setOpen] = useState<OpenState>(null);
  const scheme = chromeScheme(backgroundColor);
  const panState = useRef({ x: 0, y: 0, vx: 0, vy: 0, last: 0, targetX: 0, targetY: 0, stepping: false, cell: 220 });
  const count = items.length || 1;

  const openImage = useCallback(
    (next: OpenState) => {
      if (next) {
        setOpen(next);
        onSelect?.(items[next.item], next.item);
      } else setOpen(null);
    },
    [items, onSelect],
  );

  const pan = useCallback((columns: number, rows: number) => {
    const state = panState.current;
    state.targetX = state.x - columns * state.cell;
    state.targetY = state.y + rows * state.cell;
    state.vx = 0;
    state.vy = 0;
    state.stepping = true;
  }, []);

  const { hostRef, bind, status, input, rendererRef, invalidate } = useGallery({
    images: items.map((item) => item.src),
    count,
    loop: true,
    startIndex,
    draggable,
    wheel: false,
    pausable: autoplay,
    pauseOnHover,
    paused,
    dpr,
    dragDelta: (move) => {
      const state = panState.current;
      const now = performance.now();
      const elapsed = Math.max(0.008, (now - (state.last || now - 16)) / 1000);
      state.last = now;
      state.stepping = false;
      state.x += move.dx;
      state.y -= move.dy;
      state.vx = clamp(move.dx / elapsed, -3000, 3000);
      state.vy = clamp(-move.dy / elapsed, -3000, 3000);
      return 0;
    },
    onIndexChange,
    onTap: (point) => {
      if (open) return openImage(null);
      const hit = rendererRef.current?.pick(point.x, point.y);
      if (hit && hit.id >= 0) openImage({ id: hit.id, item: Math.floor(hit.id) % 1000 });
    },
    frame: ({ dt, width, height, reducedMotion, ambient, memory }, gallery) => {
      const state = panState.current;
      let moving = gallery.update(dt);
      const cell = cellSize > 0 ? cellSize : clamp(Math.min(width, height) * 0.3, 130, 260);
      const space = cell * clamp(gap, 0, 0.4);
      const pitch = cell + space;
      state.cell = pitch;
      if (state.stepping) {
        // Keyboard and button steps glide to their target.
        const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 9);
        state.x += (state.targetX - state.x) * k;
        state.y += (state.targetY - state.y) * k;
        if (Math.abs(state.targetX - state.x) + Math.abs(state.targetY - state.y) < 0.5) state.stepping = false;
        moving = true;
      } else if (!gallery.dragging() && (state.vx || state.vy)) {
        state.x += state.vx * dt;
        state.y += state.vy * dt;
        const decay = Math.exp(-dt / 0.45);
        state.vx = Math.abs(state.vx * decay) < 2 ? 0 : state.vx * decay;
        state.vy = Math.abs(state.vy * decay) < 2 ? 0 : state.vy * decay;
        moving = true;
      }
      const drifting = autoplay && !paused && !gallery.userPaused && ambient && !reducedMotion && !open && gallery.canAutoplay();
      if (drifting) {
        state.x -= interval * 0.6 * dt;
        state.y += interval * dt;
        moving = true;
      }

      // Open spring.
      const openTarget = open ? 1 : 0;
      memory.openT ??= 0;
      if (reducedMotion) memory.openT = openTarget;
      else {
        const h = Math.min(dt, 1 / 30);
        memory.openV = (memory.openV ?? 0) + (-110 * (memory.openT - openTarget) - 21 * (memory.openV ?? 0)) * h;
        memory.openT += memory.openV * h;
        if (Math.abs(memory.openT - openTarget) < 0.001 && Math.abs(memory.openV) < 0.01) {
          memory.openT = openTarget;
          memory.openV = 0;
        } else moving = true;
      }
      if (open) memory.openId = open.id;
      const openT = smoothstep(0, 1, memory.openT);
      const openId = open ? open.id : memory.openT > 0.001 ? (memory.openId ?? -1) : -1;

      const cards: GalleryCard[] = [];
      const columnsLeft = Math.ceil(width / 2 / pitch) + 2;
      const firstColumn = Math.floor(-state.x / pitch) - columnsLeft;
      const lastColumn = Math.floor(-state.x / pitch) + columnsLeft;
      let openCard: GalleryCard | null = null;
      for (let c = firstColumn; c <= lastColumn; c++) {
        const lane = wrap(c, DEPTH_CYCLE);
        const near = 1 + (hash(lane, 0, seed) - 0.5) * 2 * clamp(depth, 0, 0.5);
        const x = c * pitch + state.x * near;
        if (Math.abs(x) > width / 2 + pitch * 1.5) continue;
        // A repeating column of ROWS cards with seeded heights, staggered per column.
        const heights = Array.from({ length: ROWS }, (_, r) => cell * (0.78 + hash(lane, r, seed) * 0.6));
        const tile = heights.reduce((sum, h) => sum + h + space, 0);
        const offset = state.y * near + hash(lane, 99, seed) * tile;
        const firstTile = Math.floor((-height / 2 - offset) / tile) - 1;
        const lastTile = Math.floor((height / 2 - offset) / tile) + 1;
        for (let t = firstTile; t <= lastTile; t++) {
          let y = offset + t * tile + height / 2;
          for (let r = 0; r < ROWS; r++) {
            const h = heights[r];
            const cy = y - h / 2;
            y -= h + space;
            if (cy < -height / 2 - h || cy > height / 2 + h) continue;
            const item = wrap(c * 7 + (t * ROWS + r) * 3, count);
            // Ids pack the item with a unique instance number so picks know both.
            const id = item + 1000 * (wrap(c, 997) * 131 + wrap(t * ROWS + r, 131));
            const card: GalleryCard = {
              image: item,
              id,
              x,
              y: cy,
              z: (near - 1) * 60,
              scale: near,
              width: cell,
              height: h,
              radius,
              shadow: 0.35,
              dim: openT * 0.5,
            };
            if (id === openId) openCard = card;
            cards.push(card);
          }
        }
      }
      if (openCard) {
        const fit = Math.min((height * 0.7) / openCard.height, (width * 0.8) / openCard.width);
        openCard.x = lerp(openCard.x, 0, openT);
        openCard.y = lerp(openCard.y, height * 0.04, openT);
        openCard.z = 300 * openT;
        openCard.scale = lerp(openCard.scale ?? 1, fit, openT);
        openCard.radius = lerp(radius, 14 / fit, openT);
        openCard.dim = 0;
        openCard.shadow = 1;
      } else if (open) {
        // Opened from the list: rise from the center.
        const h = cell * 1.1;
        const fit = Math.min((height * 0.7) / h, (width * 0.8) / cell);
        cards.push({ image: open.item, id: -1, x: 0, y: height * 0.04, z: 300, scale: lerp(0.4, fit, openT), width: cell, height: h, radius: 14 / fit, opacity: openT, shadow: 1 });
      }
      return { cards, animating: moving, scene: { fov: 30, edgeFade: [0.05, 0.07], shadowOffset: 8, shadowBlur: 14, shadowOpacity: 0.2 } };
    },
  });

  // Optional wheel / trackpad panning (off by default so the page keeps scrolling).
  useEffect(() => {
    const element = hostRef.current?.parentElement;
    if (!element || !wheel) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const state = panState.current;
      state.stepping = false;
      state.x -= event.deltaX;
      state.y += event.deltaY;
      invalidate();
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [wheel, invalidate, hostRef]);

  const { next, previous, goTo } = input;
  useImperativeHandle(ref, () => ({ next, previous, goTo: (index: number) => goTo(index), pan: (c: number, r: number) => (pan(c, r), invalidate()), close: () => openImage(null) }), [next, previous, goTo, pan, invalidate, openImage]);

  const step = (columns: number, rows: number) => {
    pan(columns, rows);
    invalidate();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) return openImage(null);
    // Arrows pan when the canvas itself has focus; inside the image list they move between items.
    if (event.target !== event.currentTarget) return;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (event.key in moves && !open) {
      event.preventDefault();
      step(...moves[event.key]);
    }
  };

  const fallback = status === "fallback";
  const openedItem = open ? items[open.item] : undefined;
  const pad = cn(
    "grid size-8 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
    scheme === "dark" ? "text-white hover:bg-white/10" : "text-foreground hover:bg-surface-2",
  );
  return (
    <div
      ref={bind}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={cn("relative size-full min-h-[420px] touch-none overflow-hidden rounded-[inherit] outline-none select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", className)}
      style={{ backgroundColor, ...style }}
    >
      <div ref={hostRef} className="absolute inset-0">
        {fallback ? <GalleryFallback items={items} label={ariaLabel} onSelect={onSelect} className="absolute inset-0" /> : null}
      </div>
      {fallback ? null : <GalleryA11y items={items} index={input.index} label={ariaLabel} live={!autoplay} onActivate={(i) => openImage({ id: -2 - i, item: i })} />}
      <AnimatePresence>
        {captions && openedItem && !fallback ? (
          <motion.div
            key={open?.id}
            data-gallery-control
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: duration.base, ease: ease.out }}
            className={cn(
              "absolute bottom-4 left-1/2 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-full border py-1.5 pr-1.5 pl-4 shadow-lg backdrop-blur",
              scheme === "dark" ? "border-white/15 bg-zinc-900/80 text-white" : "border-border bg-background/90 text-foreground",
            )}
          >
            <p className="min-w-0 truncate text-sm">
              <span className="font-medium">{openedItem.title ?? openedItem.alt}</span>
              {openedItem.subtitle ? <span className={scheme === "dark" ? "text-white/65" : "text-muted-foreground"}> · {openedItem.subtitle}</span> : null}
            </p>
            <button type="button" aria-label="Close image" onClick={() => openImage(null)} className={pad}>
              <X className="size-4" aria-hidden="true" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {controls && !fallback ? (
        <div
          data-gallery-control
          role="group"
          aria-label="Pan the canvas"
          inert={Boolean(open)}
          className={cn(
            "absolute right-3 bottom-3 grid grid-cols-3 gap-0.5 rounded-2xl border p-1 shadow-sm backdrop-blur transition-opacity",
            open ? "opacity-0" : "opacity-100",
            scheme === "dark" ? "border-white/15 bg-zinc-900/70" : "border-border bg-background/85",
          )}
        >
          <span />
          <button type="button" data-gallery-control aria-label="Pan up" onClick={() => step(0, -1)} className={pad}>
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
          <span />
          <button type="button" data-gallery-control aria-label="Pan left" onClick={() => step(-1, 0)} className={pad}>
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <button type="button" data-gallery-control aria-label="Pan down" onClick={() => step(0, 1)} className={pad}>
            <ArrowDown className="size-4" aria-hidden="true" />
          </button>
          <button type="button" data-gallery-control aria-label="Pan right" onClick={() => step(1, 0)} className={pad}>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
