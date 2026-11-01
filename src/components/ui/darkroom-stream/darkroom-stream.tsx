"use client";

import { useCallback, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pause, Play, X } from "lucide-react";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { GalleryA11y } from "@/lib/gallery/gallery-a11y";
import { chromeScheme } from "@/lib/gallery/gallery-chrome";
import { GalleryFallback } from "@/lib/gallery/gallery-fallback";
import { clamp, lerp, smoothstep, wrap } from "@/lib/gallery/math";
import type { GalleryCard } from "@/lib/gallery/renderer";
import type { GalleryHandle, GalleryItem } from "@/lib/gallery/types";
import { useGallery } from "@/lib/gallery/use-gallery";

export interface DarkroomStreamHandle extends GalleryHandle {
  /** Adds a burst of speed, in stream cycles per second (negative flies back). */
  boost: (amount: number) => void;
  /** Opens an item (default: the active one) enlarged in the center. */
  open: (index?: number) => void;
  /** Closes the open photo. */
  close: () => void;
}

export interface DarkroomStreamProps {
  /** Photos in the stream. */
  items: GalleryItem[];
  /** Content shown in the empty center, e.g. a headline. It fades while a photo is open. */
  children?: ReactNode;
  /** Photos in flight at once. @default 28 */
  count?: number;
  /** Item the keyboard starts on. @default 0 */
  startIndex?: number;
  /** Let the stream flow on its own. @default true */
  autoplay?: boolean;
  /** Flow speed; 1 takes a photo from the center to the edge in about 12 s, negative reverses the stream into the center. @default 1 */
  speed?: number;
  /** 0 is a calm, even zoom; 1 is true perspective that rushes near the edges. @default 0.6 */
  rush?: number;
  /** Curls the paths into a spiral, in half turns from center to edge (negative curls the other way). @default 0.35 */
  spiral?: number;
  /** Empty center for a headline, as a fraction of the smaller side. @default 0.34 */
  centerSpace?: number;
  /** Photo height as a fraction of the smaller side (at mid-flight). @default 0.2 */
  size?: number;
  /** Random size variation for depth, 0–1. @default 0.35 */
  sizeVariance?: number;
  /** Photo width ÷ height. @default 0.8 */
  aspect?: number;
  /** Photo corner radius, px. @default 6 */
  radius?: number;
  /** Develop each photo on a paper border, like a print. @default false */
  printBorder?: boolean;
  /** Paper color of the print border. @default "#F7F5F0" */
  paperColor?: string;
  /** Hairline light rim around each photo, 0–1. @default 0.5 */
  rim?: number;
  /** Random tilt like scattered prints, in degrees. @default 6 */
  scatterTilt?: number;
  /** Photos emerge monochrome and low contrast, then develop to full color. @default true */
  develop?: boolean;
  /** Fades the stream into the background toward the edges, as a fraction of the size. @default 0.12 */
  edgeFade?: number;
  /** Soft shadow strength, 0–1. @default 0.6 */
  shadow?: number;
  /** Hovering the stream slows it to this fraction of its speed. @default 0.3 */
  hoverSlow?: number;
  /** Hovering a photo catches it: it stops and lifts while the rest flow past. @default true */
  catchOnHover?: boolean;
  /** Pause hover slowing and catching. @default true */
  pauseOnHover?: boolean;
  /** Drag steers: away from the center flies forward, toward it flies back, around it rotates. @default true */
  draggable?: boolean;
  /** The wheel flies through the stream. @default true */
  wheel?: boolean;
  /** Caption and close button under an open photo. @default true */
  captions?: boolean;
  /** A pause/play button in the corner. @default true */
  controls?: boolean;
  /** Background color; text switches to light on dark colors. @default "transparent" */
  backgroundColor?: string;
  /** Stops the flow (input still works). @default false */
  paused?: boolean;
  /** Highest device pixel ratio rendered. @default 2 */
  dpr?: number;
  /** Accessible name of the stream. @default "Photos" */
  ariaLabel?: string;
  /** Classes for the root, which fills its parent (at least 420px tall). */
  className?: string;
  /** Inline styles for the root. */
  style?: CSSProperties;
  /** Fires when the keyboard's active item changes. */
  onIndexChange?: (index: number) => void;
  /** Fires when a photo opens. */
  onSelect?: (item: GalleryItem, index: number) => void;
  /** Fires when a photo opens. */
  onOpen?: (item: GalleryItem, index: number) => void;
  /** Fires when the open photo closes. */
  onClose?: () => void;
  /** Imperative `next()`, `previous()`, `goTo()`, `boost(amount)`, `open(index?)` and `close()`. */
  ref?: Ref<DarkroomStreamHandle>;
}

/** Deterministic 0–1 hash of a photo slot, its cycle and a channel. */
function hash(slot: number, cycle: number, channel: number) {
  let h = Math.imul(slot + 1, 374761393) ^ Math.imul(cycle + 7919, 668265263) ^ Math.imul(channel + 1, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function toRgb(color: string): [number, number, number] {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hex) return [0.97, 0.96, 0.94];
  const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

type OpenState = { slot: number; image: number } | null;

/**
 * Photos stream outward from an empty center toward the viewer, developing like darkroom prints
 * as they travel. Rendered with the shared WebGL2 gallery engine; a hidden button list carries the
 * accessible gallery.
 */
export function DarkroomStream({
  items,
  children,
  count = 28,
  startIndex = 0,
  autoplay = true,
  speed = 1,
  rush = 0.6,
  spiral = 0.35,
  centerSpace = 0.34,
  size = 0.2,
  sizeVariance = 0.35,
  aspect = 0.8,
  radius = 6,
  printBorder = false,
  paperColor = "#F7F5F0",
  rim = 0.5,
  scatterTilt = 6,
  develop = true,
  edgeFade = 0.12,
  shadow = 0.6,
  hoverSlow = 0.3,
  catchOnHover = true,
  pauseOnHover = true,
  draggable = true,
  wheel = true,
  captions = true,
  controls = true,
  backgroundColor = "transparent",
  paused = false,
  dpr = 2,
  ariaLabel = "Photos",
  className,
  style,
  onIndexChange,
  onSelect,
  onOpen,
  onClose,
  ref,
}: DarkroomStreamProps) {
  const slots = clamp(Math.round(count), 4, 160);
  const [open, setOpen] = useState<OpenState>(null);
  const scheme = chromeScheme(backgroundColor);
  const paper = useMemo(() => toRgb(paperColor), [paperColor]);
  // Shared between pointer handlers and the render loop (never read during render).
  const motionState = useRef({ angle: 0, angleV: 0, lastMove: 0, boost: 0, slotImages: [] as number[] });

  const openItem = useCallback(
    (next: OpenState) => {
      if (next) {
        const item = items[next.image];
        if (!item) return;
        setOpen(next);
        onOpen?.(item, next.image);
        onSelect?.(item, next.image);
      } else if (open) {
        setOpen(null);
        onClose?.();
      }
    },
    [items, open, onOpen, onSelect, onClose],
  );

  const { hostRef, bind, status, input, rendererRef } = useGallery({
    images: items.map((item) => item.src),
    count: items.length,
    loop: true,
    startIndex,
    draggable,
    wheel,
    snap: false,
    inertia: 0.6,
    pauseOnHover,
    pausable: autoplay,
    paused,
    dpr,
    trackPointer: catchOnHover,
    dragDelta: (move) => {
      const cx = move.width / 2;
      const cy = move.height / 2;
      const rx = move.x - cx;
      const ry = move.y - cy;
      const length = Math.hypot(rx, ry) || 1;
      const ux = rx / length;
      const uy = ry / length;
      // Around the center rotates the stream (with momentum); along the radius flies through it.
      const tangential = move.dx * -uy + move.dy * ux;
      const turn = -tangential / Math.max(60, length);
      const state = motionState.current;
      const now = performance.now();
      const elapsed = Math.max(0.008, (now - (state.lastMove || now - 16)) / 1000);
      state.lastMove = now;
      state.angle += turn;
      state.angleV = clamp(turn / elapsed, -6, 6);
      const radial = move.dx * ux + move.dy * uy;
      return radial / Math.max(20, Math.min(move.width, move.height) * 0.05);
    },
    onIndexChange,
    onSelect: (index) => openItem({ slot: -1, image: index }),
    onEscape: () => openItem(null),
    onTap: (point) => {
      if (open) return openItem(null);
      const hit = rendererRef.current?.pick(point.x, point.y);
      if (!hit || hit.id < 0) return;
      const image = motionState.current.slotImages[hit.id];
      if (image !== undefined) openItem({ slot: hit.id, image });
    },
    frame: ({ dt, width, height, reducedMotion, ambient, memory, renderer }, gallery) => {
      const state = motionState.current;
      let moving = false;
      // Flow speed eases toward its target: hover slows it, an open photo almost stops it.
      let rate = autoplay && !paused && !gallery.userPaused && ambient && !reducedMotion ? speed / 12 : 0;
      if (pauseOnHover && gallery.hovering()) rate *= clamp(hoverSlow, 0, 1);
      if (open) rate *= 0.12;
      memory.rate = (memory.rate ?? 0) + (rate - (memory.rate ?? 0)) * (1 - Math.exp(-dt * 3));
      if (rate === 0 && Math.abs(memory.rate) < 0.0015) memory.rate = 0;
      memory.boostV = (memory.boostV ?? 0) + state.boost;
      state.boost = 0;
      memory.flow = (memory.flow ?? 0) + (memory.rate + memory.boostV) * dt;
      memory.boostV *= Math.exp(-dt * 1.6);
      if (Math.abs(memory.boostV) < 1e-4) memory.boostV = 0;
      if (memory.rate || memory.boostV) moving = true;
      if (gallery.update(dt)) moving = true;
      if (!gallery.dragging() && state.angleV) {
        state.angle += state.angleV * dt;
        state.angleV *= Math.exp(-dt / 0.7);
        if (Math.abs(state.angleV) < 0.002) state.angleV = 0;
        moving = true;
      }
      const travel = memory.flow + gallery.position() / slots;

      // Open photo spring (0 = in the stream, 1 = enlarged in the center).
      const openTarget = open ? 1 : 0;
      if (open) memory.openSlot = open.slot;
      memory.openT ??= 0;
      if (reducedMotion) memory.openT = openTarget;
      else {
        const h = Math.min(dt, 1 / 30);
        memory.openV = (memory.openV ?? 0) + (-120 * (memory.openT - openTarget) - 22 * (memory.openV ?? 0)) * h;
        memory.openT += memory.openV * h;
        if (Math.abs(memory.openT - openTarget) < 0.001 && Math.abs(memory.openV) < 0.01) {
          memory.openT = openTarget;
          memory.openV = 0;
        } else moving = true;
      }
      const openT = smoothstep(0, 1, memory.openT);
      const openSlot = open ? open.slot : memory.openT > 0.001 ? (memory.openSlot ?? -1) : -1;

      // Hovering a photo catches it; an open photo stays caught until it is back in the stream.
      const pointer = gallery.pointer();
      const hit = catchOnHover && pauseOnHover && pointer.inside && !gallery.dragging() && openSlot < 0 ? renderer.pick(pointer.x, pointer.y) : null;
      const caught = openSlot >= 0 ? openSlot : hit && hit.id >= 0 ? hit.id : -1;
      if ((memory.caught ?? -1) !== caught) {
        const previous = memory.caught ?? -1;
        if (previous >= 0) {
          // Release: shift this photo's phase so it carries on exactly where it stopped.
          memory[`d${previous}`] = (memory.caughtCycle ?? 0) + (memory.caughtS ?? 0) - travel - previous / slots;
        }
        if (caught >= 0) {
          const raw = travel + caught / slots + (memory[`d${caught}`] ?? 0);
          memory.caughtCycle = Math.floor(raw);
          memory.caughtS = raw - Math.floor(raw);
        }
        memory.caught = caught;
      }

      const minSide = Math.min(width, height);
      const inner = clamp(centerSpace, 0, 0.9) * minSide * 0.5;
      const outer = Math.hypot(width, height) / 2 + minSide * size;
      const photoHeight = clamp(size, 0.05, 0.6) * minSide;
      const photoWidth = photoHeight * clamp(aspect, 0.3, 3);
      const border = printBorder ? photoHeight * 0.055 : 0;
      const perspective = (s: number) => (1 / (1 - s * 0.86) - 1) / (1 / 0.14 - 1);
      const cards: GalleryCard[] = [];
      const itemsCount = items.length || 1;
      for (let slot = 0; slot < slots; slot++) {
        const raw = slot === caught ? (memory.caughtCycle ?? 0) + (memory.caughtS ?? 0) : travel + slot / slots + (memory[`d${slot}`] ?? 0);
        const cycle = Math.floor(raw);
        const s = raw - cycle;
        const u = lerp(s, perspective(s), clamp(rush, 0, 1));
        const image = wrap(slot + cycle * slots, itemsCount);
        state.slotImages[slot] = image;
        const phi = hash(slot, cycle, 0) * Math.PI * 2 + spiral * u * Math.PI + state.angle;
        const distance = inner + (outer - inner) * u;
        const variance = 1 + (hash(slot, cycle, 1) - 0.5) * 2 * clamp(sizeVariance, 0, 0.9);
        const tilt = ((hash(slot, cycle, 2) - 0.5) * 2 * scatterTilt * Math.PI) / 180;
        const fade = smoothstep(0, 0.1, s) * (1 - smoothstep(0.9, 1, u));
        const card: GalleryCard = {
          image,
          id: slot,
          x: Math.cos(phi) * distance,
          y: Math.sin(phi) * distance,
          z: u * 40,
          rotateZ: tilt,
          scale: (0.16 + 1.1 * u) * variance,
          width: photoWidth,
          height: photoHeight,
          radius,
          border,
          opacity: fade,
          tone: develop ? smoothstep(0.06, 0.45, u) : 1,
          ring: clamp(rim, 0, 1) * 0.5,
          shadow: clamp(shadow, 0, 1) * fade,
          dim: openT * 0.45,
        };
        if (slot === caught && slot !== openSlot) {
          // Caught: it stops and lifts while the rest flow past.
          card.scale = (card.scale ?? 1) * 1.12;
          card.z = 120;
          card.tone = 1;
          card.opacity = 1;
          card.shadow = 1;
        }
        if (slot === openSlot) {
          const target = Math.min((height * 0.62) / photoHeight, (width * 0.82) / photoWidth);
          card.x = lerp(card.x, 0, openT);
          card.y = lerp(card.y, height * 0.05, openT);
          card.rotateZ = lerp(tilt, 0, openT);
          card.scale = lerp(card.scale ?? 1, target, openT);
          card.z = 200;
          card.tone = lerp(card.tone ?? 1, 1, openT);
          card.opacity = Math.max(card.opacity ?? 1, openT);
          card.shadow = 1;
          card.dim = 0;
        }
        cards.push(card);
      }
      // Opened from the keyboard or the list: the photo rises from the center.
      if (open && open.slot < 0) {
        const target = Math.min((height * 0.62) / photoHeight, (width * 0.82) / photoWidth);
        cards.push({
          image: open.image,
          id: -1,
          x: 0,
          y: height * 0.05,
          z: 200,
          scale: lerp(0.3, target, openT),
          width: photoWidth,
          height: photoHeight,
          radius,
          border,
          opacity: openT,
          shadow: openT,
          ring: clamp(rim, 0, 1) * 0.5,
        });
      }
      return {
        cards,
        animating: moving,
        scene: {
          fov: 30,
          edgeFade: [clamp(edgeFade, 0, 0.5), clamp(edgeFade, 0, 0.5)],
          paper,
          ring: [1, 1, 1],
          shadowOffset: 10,
          shadowBlur: 18,
          shadowOpacity: 0.24,
        },
      };
    },
  });

  const { next, previous, goTo, togglePause, userPaused } = input;
  useImperativeHandle(
    ref,
    () => ({
      next,
      previous,
      goTo: (index: number) => goTo(index),
      boost: (amount: number) => {
        motionState.current.boost += amount;
      },
      open: (index?: number) => openItem({ slot: -1, image: wrap(index ?? input.activeIndex(), items.length || 1) }),
      close: () => openItem(null),
    }),
    [next, previous, goTo, openItem, input, items.length],
  );

  const fallback = status === "fallback";
  const openedItem = open ? items[open.image] : undefined;
  const flowing = autoplay && !paused && !userPaused;
  return (
    <div
      ref={bind}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      // Focusable by click (not by Tab) so Escape and arrow keys work after pointer use.
      tabIndex={-1}
      className={cn("relative outline-none size-full min-h-[420px] touch-pan-y overflow-hidden rounded-[inherit] select-none [container-type:size] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", className)}
      style={{ backgroundColor, ...style }}
    >
      <div ref={hostRef} className="absolute inset-0">
        {fallback ? <GalleryFallback items={items} label={ariaLabel} aspect={String(aspect)} onSelect={onSelect} className="absolute inset-0" /> : null}
      </div>
      {children && !fallback ? (
        <div className={cn("pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-300 motion-reduce:transition-none", open ? "opacity-0" : "opacity-100")}>
          <div data-gallery-control inert={Boolean(open)} className={cn("max-w-[44cqmin] text-center", !open && "pointer-events-auto")}>
            {children}
          </div>
        </div>
      ) : null}
      {fallback ? null : (
        <GalleryA11y items={items} index={input.index} label={ariaLabel} live={!flowing} onActivate={(i) => openItem({ slot: -1, image: i })} />
      )}
      <AnimatePresence>
        {captions && openedItem && !fallback ? (
          <motion.div
            key={open?.image}
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
            <button
              type="button"
              aria-label="Close photo"
              onClick={() => openItem(null)}
              className={cn("grid size-8 shrink-0 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", scheme === "dark" ? "hover:bg-white/10" : "hover:bg-surface-2")}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {controls && autoplay && !fallback ? (
        <button
          type="button"
          data-gallery-control
          aria-label={flowing ? "Pause stream" : "Play stream"}
          aria-pressed={!flowing}
          onClick={togglePause}
          className={cn(
            "absolute right-3 bottom-3 grid size-9 cursor-pointer place-items-center rounded-full border outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring",
            open ? "pointer-events-none opacity-0" : "opacity-100",
            scheme === "dark" ? "border-white/15 bg-zinc-900/70 text-white hover:bg-zinc-800" : "border-border bg-background/85 text-foreground hover:bg-surface-2",
          )}
        >
          {flowing ? <Pause className="size-3.5 fill-current" aria-hidden="true" /> : <Play className="ml-0.5 size-3.5 fill-current" aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  );
}
