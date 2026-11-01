"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type Ref } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { GalleryA11y } from "@/lib/gallery/gallery-a11y";
import { GalleryCaption, chromeScheme } from "@/lib/gallery/gallery-chrome";
import { GalleryFallback } from "@/lib/gallery/gallery-fallback";
import { clamp, smoothstep } from "@/lib/gallery/math";
import type { GalleryCard } from "@/lib/gallery/renderer";
import type { GalleryHandle, GalleryItem } from "@/lib/gallery/types";
import { useGallery } from "@/lib/gallery/use-gallery";

export interface SleeveRailHandle extends GalleryHandle {
  /** Slides the focused sleeve's record out and spins it. */
  play: () => void;
  /** Slides the record back into its sleeve. */
  stop: () => void;
}

export interface SleeveRailProps {
  /** Albums: the image is the sleeve artwork (square works best), title and subtitle the album and artist. */
  items: GalleryItem[];
  /** Sleeve focused first. @default 0 */
  startIndex?: number;
  /** Step to the next sleeve every `interval` (cycles back to the first). Pauses while a record plays. @default false */
  autoplay?: boolean;
  /** Milliseconds between autoplay steps. @default 4000 */
  interval?: number;
  /** Pause autoplay while hovered. @default true */
  pauseOnHover?: boolean;
  /** Drag or throw the rail. @default true */
  draggable?: boolean;
  /** One sleeve per wheel notch. @default true */
  wheel?: boolean;
  /** Title and artist of the focused sleeve, sliding with the rail. @default true */
  captions?: boolean;
  /** The ruler under the rail: a tick per sleeve, a play button at its center and arrows at its ends. @default true */
  controls?: boolean;
  /** Tilt per step outward, like a hand of cards, in degrees. @default 5 */
  fanAngle?: number;
  /** How far neighbours turn away from the viewer, in degrees. @default 40 */
  turnAngle?: number;
  /** How far neighbours recede, px. @default 170 */
  depth?: number;
  /** Distance from the focused sleeve to its first neighbour, in sleeve widths. @default 0.62 */
  spread?: number;
  /** How much tighter the outer sleeves pack, 0–0.95. @default 0.6 */
  packing?: number;
  /** Sleeves visible on each side, 1–5. @default 3 */
  visibleSide?: number;
  /** Sleeve corner radius, px. @default 6 */
  radius?: number;
  /** How much outer sleeves darken, 0–1. @default 0.25 */
  dim?: number;
  /** Drop shadow strength, 0–1. @default 0.8 */
  shadow?: number;
  /** Show the vinyl record (peeks on hover, slides out to play). @default true */
  record?: boolean;
  /** Vinyl color. @default "#121212" */
  recordColor?: string;
  /** Spin speed while playing. @default 33.3 */
  rpm?: number;
  /** Play button and active tick color. "auto" picks the most vivid color of the focused artwork and adjusts it for contrast. @default "auto" */
  accentColor?: string;
  /** Background color; captions and controls switch to light text on dark colors. @default "transparent" */
  backgroundColor?: string;
  /** Stops autoplay and spinning (input still works). @default false */
  paused?: boolean;
  /** Highest device pixel ratio rendered. @default 2 */
  dpr?: number;
  /** Accessible name of the rail. @default "Albums" */
  ariaLabel?: string;
  /** Classes for the root, which fills its parent (at least 420px tall). */
  className?: string;
  /** Inline styles for the root. */
  style?: CSSProperties;
  /** Fires when the focused sleeve changes. */
  onIndexChange?: (index: number) => void;
  /** Fires when the focused sleeve is clicked or Enter is pressed (the record starts playing). */
  onSelect?: (item: GalleryItem, index: number) => void;
  /** Fires when a record starts or stops playing. */
  onPlayChange?: (index: number, playing: boolean) => void;
  /** Imperative `next()`, `previous()`, `goTo(index)`, `play()` and `stop()`. */
  ref?: Ref<SleeveRailHandle>;
}

const TICK = 14;
const RECORD_ID = -2;
const DEFAULT_ACCENT = "#2563EB";
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** A vinyl record (grooves, track gaps, rim) drawn once to a data URL. */
function vinylTexture(color: string) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const r = size / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(r, r, r - 1, 0, Math.PI * 2);
  ctx.fill();
  for (let g = r * 0.4; g < r * 0.965; g += 1.6) {
    const gap = (g > r * 0.62 && g < r * 0.635) || (g > r * 0.79 && g < r * 0.805);
    ctx.strokeStyle = gap ? "rgba(0,0,0,0.4)" : `rgba(255,255,255,${(0.025 + ((g * 7.13) % 1) * 0.035).toFixed(3)})`;
    ctx.lineWidth = gap ? 2 : 0.8;
    ctx.beginPath();
    ctx.arc(r, r, g, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(r, r, r - 2, 0, Math.PI * 2);
  ctx.stroke();
  return canvas.toDataURL("image/png");
}

/** Two soft highlight lobes. Drawn over the record without spinning, so the light stays put. */
function sheenTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx || !("createConicGradient" in ctx)) return "";
  const gradient = ctx.createConicGradient(-Math.PI / 4, size / 2, size / 2);
  for (const [stop, alpha] of [[0, 0], [0.08, 0.2], [0.18, 0], [0.5, 0], [0.58, 0.14], [0.68, 0], [1, 0]] as const) gradient.addColorStop(stop, `rgba(255,255,255,${alpha})`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fill();
  return canvas.toDataURL("image/png");
}

const luminance = ([r, g, b]: number[]) => {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const accentCache = new Map<string, string>();

/** The most vivid color in an image, darkened or lightened until it reads at 3:1 against the background. */
function vividAccent(image: HTMLImageElement, dark: boolean) {
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  let best: number[] | null = null;
  let bestScore = -1;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const value = max / 255;
    const saturation = max ? (max - min) / max : 0;
    const score = saturation * (1 - Math.abs(value - 0.7));
    if (score > bestScore) {
      bestScore = score;
      best = [r, g, b];
    }
  }
  if (!best || bestScore < 0.12) return null;
  const against = dark ? [12, 12, 14] : [255, 255, 255];
  let color = best;
  for (let step = 0; step < 24 && contrast(color, against) < 3; step++) {
    color = color.map((c) => (dark ? c + (255 - c) * 0.12 : c * 0.88));
  }
  return `rgb(${color.map((c) => Math.round(c)).join(", ")})`;
}

/**
 * A fanned rail of album sleeves, each with a vinyl record tucked inside. The focused sleeve sits
 * in front; hover lifts its record, click or Enter slides it out to spin. Rendered with the shared
 * WebGL2 gallery engine; a hidden button list carries the accessible gallery.
 */
export function SleeveRail({
  items,
  startIndex = 0,
  autoplay = false,
  interval = 4000,
  pauseOnHover = true,
  draggable = true,
  wheel = true,
  captions = true,
  controls = true,
  fanAngle = 5,
  turnAngle = 40,
  depth = 170,
  spread = 0.62,
  packing = 0.6,
  visibleSide = 3,
  radius = 6,
  dim = 0.25,
  shadow = 0.8,
  record = true,
  recordColor = "#121212",
  rpm = 33.3,
  accentColor = "auto",
  backgroundColor = "transparent",
  paused = false,
  dpr = 2,
  ariaLabel = "Albums",
  className,
  style,
  onIndexChange,
  onSelect,
  onPlayChange,
  ref,
}: SleeveRailProps) {
  const count = items.length;
  const [playing, setPlaying] = useState(false);
  const [autoAccent, setAutoAccent] = useState<{ src: string; color: string } | null>(null);
  const ticks = useRef<HTMLDivElement>(null);
  const scrubbing = useRef<{ id: number; x: number; moved: boolean } | null>(null);
  const scheme = chromeScheme(backgroundColor);

  // Generated textures (client only; the server never renders the canvas).
  const vinyl = useMemo(() => (record && typeof document !== "undefined" ? vinylTexture(recordColor) : ""), [record, recordColor]);
  const sheen = useMemo(() => (record && typeof document !== "undefined" ? sheenTexture() : ""), [record]);
  const images = useMemo(() => [...items.map((item) => item.src), vinyl, sheen], [items, vinyl, sheen]);
  const vinylIndex = count;
  const sheenIndex = count + 1;
  const chromeHeight = (captions ? 44 : 0) + (controls ? 52 : 0);

  const setPlay = useCallback(
    (next: boolean, index: number) => {
      if (next === playing) return;
      setPlaying(next);
      onPlayChange?.(index, next);
    },
    [playing, onPlayChange],
  );

  const { hostRef, bind, status, input, rendererRef } = useGallery({
    images,
    count,
    startIndex,
    draggable,
    wheel,
    autoplay,
    interval,
    pauseOnHover,
    paused,
    dpr,
    trackPointer: record,
    dragDistance: (width, height) => Math.min((height - chromeHeight) * (record ? 0.46 : 0.62), width * 0.34) * spread,
    onIndexChange: (index) => {
      if (playing) setPlay(false, input.index);
      onIndexChange?.(index);
    },
    onSelect: (index) => {
      if (!playing) onSelect?.(items[index], index);
      setPlay(!playing, index);
    },
    onEscape: () => setPlay(false, input.index),
    onTap: (point, gallery) => {
      const hit = rendererRef.current?.pick(point.x, point.y);
      if (!hit) return;
      const active = gallery.activeIndex();
      if (hit.id === RECORD_ID || hit.id === active) {
        if (!playing && hit.id === active) onSelect?.(items[active], active);
        setPlay(!playing, active);
      } else gallery.goTo(hit.id);
    },
    frame: ({ dt, width, height, reducedMotion, ambient, memory, renderer }, gallery) => {
      if (memory.ambient !== Number(ambient)) {
        memory.ambient = Number(ambient);
        gallery.hold("ambient", !ambient);
      }
      let moving = gallery.update(dt);
      const position = gallery.position();
      const active = gallery.activeIndex();
      // The ruler's ticks slide with the rail (direct style write: no React render per frame).
      if (ticks.current) ticks.current.style.transform = `translateX(${(-position * TICK).toFixed(2)}px)`;

      const size = Math.min(height * (record ? 0.46 : 0.62), width * 0.34);
      const baseY = record ? -size * 0.12 : 0;
      const fan = toRad(fanAngle);
      const turn = toRad(turnAngle);
      const first = size * spread;
      const packed = first * (1 - clamp(packing, 0, 0.95));
      const side = clamp(Math.round(visibleSide), 1, 5);
      const cards: GalleryCard[] = [];
      for (let i = 0; i < count; i++) {
        const offset = i - position;
        const t = Math.abs(offset);
        if (t > side + 1) continue;
        const sign = Math.sign(offset);
        const near = Math.min(t, 1);
        const outer = Math.min(t, side);
        const opacity = 1 - smoothstep(side - 0.3, side + 0.7, t);
        cards.push({
          image: i,
          id: i,
          x: sign * (t < 1 ? t * first : first + (t - 1) * packed),
          // A gentle arc, like cards fanned in a hand.
          y: baseY - outer * outer * size * 0.01 * (fanAngle / 5),
          z: -depth * (near + Math.max(0, t - 1) * 0.35),
          rotateY: -sign * near * turn,
          rotateZ: -sign * outer * fan,
          width: size,
          height: size,
          radius,
          opacity,
          dim: clamp(dim, 0, 1) * Math.min(1, t / side),
          shadow: clamp(shadow, 0, 1) * opacity,
        });
      }

      if (record) {
        // Hover over the focused sleeve lifts its record a little.
        const pointer = gallery.pointer();
        const hit = pointer.inside && !gallery.dragging() ? renderer.pick(pointer.x, pointer.y) : null;
        const hovered = hit !== null && (hit.id === active || hit.id === RECORD_ID);
        // The record belongs to one sleeve: when focus moves on, it tucks back in before following.
        if (memory.owner === undefined) memory.owner = active;
        let target = 0;
        if (memory.owner !== active) {
          if ((memory.offset ?? 0) < 0.02) memory.owner = active;
        } else target = playing ? 1 : hovered ? 0.17 : 0;
        const offset = memory.offset ?? 0;
        if (reducedMotion) {
          memory.offset = target;
          memory.offsetV = 0;
        } else {
          const omega = 13;
          memory.offsetV = (memory.offsetV ?? 0) + (-omega * omega * (offset - target) - 2 * omega * (memory.offsetV ?? 0)) * Math.min(dt, 1 / 30);
          memory.offset = offset + memory.offsetV * Math.min(dt, 1 / 30);
          if (Math.abs(memory.offset - target) < 0.001 && Math.abs(memory.offsetV) < 0.01) {
            memory.offset = target;
            memory.offsetV = 0;
          } else moving = true;
        }
        const spinning = playing && !paused && !reducedMotion && memory.offset > 0.9;
        const spinTarget = spinning ? (rpm / 60) * Math.PI * 2 : 0;
        memory.spinV = (memory.spinV ?? 0) + (spinTarget - (memory.spinV ?? 0)) * (1 - Math.exp(-dt * 3));
        if (!spinning && memory.spinV < 0.01) memory.spinV = 0;
        memory.spin = ((memory.spin ?? 0) + memory.spinV * dt) % (Math.PI * 2);
        if (memory.spinV) moving = true;

        const sleeve = cards.find((card) => card.id === memory.owner);
        const lift = memory.offset;
        if (sleeve && lift > 0.001) {
          // While playing, the sleeve dips to make room for the record above it.
          sleeve.y -= lift * size * 0.3;
          const rz = sleeve.rotateZ ?? 0;
          const distance = lift * size * 0.98;
          const cx = sleeve.x - Math.sin(rz) * distance;
          const cy = sleeve.y + Math.cos(rz) * distance;
          const disc = size * 0.96;
          const base = { id: RECORD_ID, x: cx, y: cy, rotateY: sleeve.rotateY, opacity: sleeve.opacity, round: 1 };
          cards.push(
            { ...base, image: vinylIndex, z: sleeve.z - 2, rotateZ: rz - memory.spin, width: disc, height: disc, shadow: 0.5 * (sleeve.opacity ?? 1) },
            { ...base, image: memory.owner, z: sleeve.z - 1.6, rotateZ: rz - memory.spin, width: disc * 0.36, height: disc * 0.36 },
            { ...base, image: -1, z: sleeve.z - 1.4, rotateZ: 0, width: disc * 0.035, height: disc * 0.035, fill: [0.92, 0.92, 0.93, 1] },
          );
          if (sheen && renderer.isLoaded(sheenIndex)) cards.push({ ...base, image: sheenIndex, z: sleeve.z - 1.2, rotateZ: rz, width: disc, height: disc });
        }
      }

      return {
        cards,
        animating: moving,
        scene: { fov: 32, shadowOffset: 12, shadowBlur: 20, shadowOpacity: 0.26, edgeFade: [0.06, 0] },
      };
    },
  });

  const { next, previous, goTo, hold, scrub, scrubEnd, activeIndex } = input;
  useEffect(() => {
    hold("playing", playing);
  }, [hold, playing]);

  useImperativeHandle(
    ref,
    () => ({
      next,
      previous,
      goTo: (index: number) => goTo(index),
      play: () => setPlay(true, activeIndex()),
      stop: () => setPlay(false, activeIndex()),
    }),
    [next, previous, goTo, activeIndex, setPlay],
  );

  // "auto" accent: the most vivid color of the focused artwork (cached per image).
  const focused = items[input.index];
  const autoSrc = focused?.src ?? "";
  const dark = scheme === "dark";
  useEffect(() => {
    if (accentColor !== "auto" || !autoSrc) return;
    const key = `${autoSrc}|${dark}`;
    let cancelled = false;
    const cached = accentCache.get(key);
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = autoSrc;
    (cached ? Promise.resolve() : image.decode()).then(
      () => {
        const color = cached ?? vividAccent(image, dark) ?? DEFAULT_ACCENT;
        accentCache.set(key, color);
        if (!cancelled) setAutoAccent({ src: key, color });
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [accentColor, autoSrc, dark]);
  const accent = accentColor === "auto" ? (autoAccent?.src === `${autoSrc}|${dark}` ? autoAccent.color : (autoAccent?.color ?? DEFAULT_ACCENT)) : accentColor;

  const onRulerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    scrubbing.current = { id: event.pointerId, x: event.clientX, moved: false };
  };
  const onRulerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = scrubbing.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 4) return;
    drag.moved = true;
    drag.x = event.clientX;
    scrub(-dx / TICK);
  };
  const onRulerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = scrubbing.current;
    scrubbing.current = null;
    if (!drag || drag.id !== event.pointerId) return;
    if (drag.moved) return scrubEnd();
    // A click jumps to the tick under the pointer.
    const rect = event.currentTarget.getBoundingClientRect();
    goTo(activeIndex() + Math.round((event.clientX - rect.left - rect.width / 2) / TICK));
  };

  const fallback = status === "fallback";
  const muted = scheme === "dark" ? "bg-white/30" : "bg-foreground/25";
  const button = cn(
    "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full outline-none transition-[background-color,transform] duration-150 active:scale-[0.94] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
    scheme === "dark" ? "text-white hover:bg-white/10" : "text-foreground hover:bg-surface-2",
  );

  return (
    <div
      ref={bind}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className={cn("relative flex size-full min-h-[420px] touch-pan-y flex-col rounded-[inherit] select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", className)}
      style={{ backgroundColor, "--sleeve-accent": accent, ...style } as CSSProperties}
    >
      <div ref={hostRef} className="relative min-h-0 flex-1">
        {fallback ? <GalleryFallback items={items} label={ariaLabel} aspect="1 / 1" onSelect={onSelect} className="absolute inset-0" /> : null}
      </div>
      {fallback ? null : (
        <GalleryA11y
          items={items}
          index={input.index}
          label={ariaLabel}
          live={!autoplay || paused}
          onFocusItem={(i) => goTo(i)}
          onActivate={(i) => {
            if (i !== input.index) return goTo(i);
            if (!playing) onSelect?.(items[i], i);
            setPlay(!playing, i);
          }}
        />
      )}
      {captions && !fallback ? <GalleryCaption item={focused} index={input.index} count={count} scheme={scheme} className="mx-auto h-11 w-full max-w-xs shrink-0 text-center" /> : null}
      {controls && !fallback ? (
        <div data-gallery-control className="relative mx-auto flex h-[52px] w-full max-w-md shrink-0 items-center gap-1 px-3">
          <button type="button" data-gallery-control aria-label="Previous album" onClick={previous} disabled={input.index <= 0} className={cn(button, "disabled:pointer-events-none disabled:opacity-35")}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <div
            aria-hidden="true"
            onPointerDown={onRulerDown}
            onPointerMove={onRulerMove}
            onPointerUp={onRulerUp}
            onPointerCancel={onRulerUp}
            className="relative h-full flex-1 cursor-ew-resize touch-none overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_20%,black_80%,transparent)]"
          >
            <div ref={ticks} className="absolute inset-y-0 left-1/2">
              {items.map((item, i) => (
                <span
                  key={`${item.src}-${i}`}
                  className={cn(
                    "absolute bottom-3 w-px -translate-x-1/2 rounded-full transition-[height,background-color] duration-200 motion-reduce:transition-none",
                    i === input.index ? (record ? "h-0" : "h-5 bg-[var(--sleeve-accent)]") : i % 5 === 0 ? cn("h-4", muted) : cn("h-2.5", muted),
                  )}
                  style={{ left: i * TICK }}
                />
              ))}
            </div>
          </div>
          {record ? (
            <button
              type="button"
              data-gallery-control
              aria-label={`${playing ? "Stop" : "Play"} ${focused?.title ?? "album"}`}
              aria-pressed={playing}
              onClick={() => {
                if (!playing) onSelect?.(items[input.index], input.index);
                setPlay(!playing, input.index);
              }}
              className="absolute left-1/2 grid size-10 -translate-x-1/2 cursor-pointer place-items-center rounded-full bg-[var(--sleeve-accent)] text-white shadow-md transition-[transform,background-color] duration-200 outline-none active:scale-[0.94] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              {playing ? <Pause className="size-4 fill-current" aria-hidden="true" /> : <Play className="ml-0.5 size-4 fill-current" aria-hidden="true" />}
            </button>
          ) : null}
          <button type="button" data-gallery-control aria-label="Next album" onClick={next} disabled={input.index >= count - 1} className={cn(button, "disabled:pointer-events-none disabled:opacity-35")}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
