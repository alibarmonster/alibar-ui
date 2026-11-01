"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from "react";
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/lib/gallery/types";

export interface ScatteredPrintsProps {
  /** Photos, printed as polaroids. */
  items: GalleryItem[];
  /** Prints on the table. @default the number of items, up to 12 */
  count?: number;
  /** Maximum random tilt, in degrees. @default 14 */
  scatterTilt?: number;
  /** Print width as a fraction of the table width (clamped to a readable size). @default 0.22 */
  size?: number;
  /** Seed for the scatter. @default 11 */
  seed?: number;
  /** Pick prints up and throw them. @default true */
  draggable?: boolean;
  /** Handwritten-style title on each print. @default true */
  captions?: boolean;
  /** Table color. @default "transparent" */
  backgroundColor?: string;
  /** Accessible name of the table. @default "Prints" */
  ariaLabel?: string;
  /** Classes for the root, which fills its parent (at least 420px tall). */
  className?: string;
  /** Inline styles for the root. */
  style?: CSSProperties;
  /** Fires when a print is enlarged. */
  onSelect?: (item: GalleryItem, index: number) => void;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function Print({
  item,
  index,
  total,
  spot,
  table,
  z,
  enlarged,
  draggable,
  captions,
  reduceMotion,
  onFront,
  onToggle,
}: {
  item: GalleryItem;
  index: number;
  total: number;
  spot: { left: number; top: number; tilt: number };
  table: RefObject<HTMLDivElement | null>;
  z: number;
  enlarged: boolean;
  draggable: boolean;
  captions: boolean;
  reduceMotion: boolean;
  onFront: (index: number) => void;
  onToggle: (index: number) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(spot.tilt);
  const scale = useMotionValue(1);
  const element = useRef<HTMLButtonElement>(null);
  const resting = useRef({ x: 0, y: 0, rotate: spot.tilt });
  const dragged = useRef(false);
  const spring = reduceMotion ? { duration: 0 } : ({ type: "spring", stiffness: 260, damping: 28 } as const);

  // Enlarge: fly to the center of the table, upright and larger; put back to where it was.
  useEffect(() => {
    const el = element.current;
    const box = table.current;
    if (!el || !box) return;
    if (enlarged) {
      resting.current = { x: x.get(), y: y.get(), rotate: rotate.get() };
      const rect = el.getBoundingClientRect();
      const area = box.getBoundingClientRect();
      const factor = Math.min(2.2, (area.height * 0.78) / (rect.height / scale.get()));
      animate(x, x.get() + area.left + area.width / 2 - (rect.left + rect.width / 2), spring);
      animate(y, y.get() + area.top + area.height / 2 - (rect.top + rect.height / 2), spring);
      animate(rotate, 0, spring);
      animate(scale, factor, spring);
    } else if (scale.get() !== 1) {
      animate(x, resting.current.x, spring);
      animate(y, resting.current.y, spring);
      animate(rotate, resting.current.rotate, spring);
      animate(scale, 1, spring);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs only when the enlarged state flips
  }, [enlarged]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // A throw spins the print a little in the direction it flew.
    if (!reduceMotion) animate(rotate, clamp(rotate.get() + info.velocity.x * 0.012, -40, 40), { type: "spring", stiffness: 120, damping: 18 });
    window.setTimeout(() => {
      dragged.current = false;
    }, 0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const nudges: Record<string, [number, number]> = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
    const move = nudges[event.key];
    if (!move || enlarged) return;
    event.preventDefault();
    animate(x, x.get() + move[0], reduceMotion ? { duration: 0 } : { duration: 0.15 });
    animate(y, y.get() + move[1], reduceMotion ? { duration: 0 } : { duration: 0.15 });
  };

  return (
    <motion.button
      ref={element}
      type="button"
      aria-pressed={enlarged}
      drag={draggable && !enlarged}
      dragConstraints={table}
      dragElastic={0.18}
      dragMomentum={!reduceMotion}
      dragTransition={{ power: 0.35, timeConstant: 260 }}
      onPointerDown={() => onFront(index)}
      onFocus={() => onFront(index)}
      onDragStart={() => {
        dragged.current = true;
      }}
      onDragEnd={onDragEnd}
      onDoubleClick={() => onToggle(index)}
      onClick={(event) => {
        // Keyboard activation (Enter/Space) enlarges; mouse clicks need a double-click.
        if (event.detail === 0) onToggle(index);
      }}
      onKeyDown={onKeyDown}
      whileDrag={reduceMotion ? undefined : { scale: 1.06 }}
      style={{ x, y, rotate, scale, left: `${spot.left}%`, top: `${spot.top}%`, zIndex: enlarged ? 1000 : z }}
      className={cn(
        "absolute w-[clamp(120px,var(--print),220px)] cursor-grab touch-none rounded-[3px] bg-[#FBFAF7] p-2 pb-1 text-left shadow-[0_1px_2px_rgb(0_0_0/0.12),0_10px_24px_-10px_rgb(0_0_0/0.35)] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
        enlarged && "cursor-zoom-out shadow-[0_2px_4px_rgb(0_0_0/0.12),0_30px_60px_-20px_rgb(0_0_0/0.5)]",
      )}
    >
      <span className="sr-only">
        {item.title ?? item.alt}
        {item.subtitle ? `, ${item.subtitle}` : ""}. Print {index + 1} of {total}. {enlarged ? "Enlarged." : "Press Enter to enlarge, arrows to move."}
      </span>
      <span aria-hidden="true" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic */}
        <img src={item.src} alt="" draggable={false} className="pointer-events-none block aspect-square w-full bg-zinc-200 object-cover" />
        {captions ? <span className="mt-1.5 mb-1 block truncate font-[cursive,ui-rounded] text-[clamp(11px,1.6cqw,15px)] text-zinc-700 italic">{item.title ?? item.alt}</span> : null}
      </span>
    </motion.button>
  );
}

/**
 * Polaroids scattered on a table. Drag to pick one up and throw it (simple momentum and spin);
 * double-click (or Enter) to bring it to the front, enlarged in the center.
 */
export function ScatteredPrints({
  items,
  count,
  scatterTilt = 14,
  size = 0.22,
  seed = 11,
  draggable = true,
  captions = true,
  backgroundColor = "transparent",
  ariaLabel = "Prints",
  className,
  style,
  onSelect,
}: ScatteredPrintsProps) {
  const total = Math.min(items.length, Math.max(1, Math.round(count ?? 12)));
  const table = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const [order, setOrder] = useState<number[]>(() => Array.from({ length: total }, (_, i) => i));
  const [enlarged, setEnlarged] = useState<number | null>(null);

  // A seeded scatter: a loose grid with jitter so prints overlap without hiding each other.
  const spots = useMemo(() => {
    const random = mulberry32(seed);
    const columns = Math.ceil(Math.sqrt(total * 1.6));
    const rows = Math.ceil(total / columns);
    return Array.from({ length: total }, (_, i) => ({
      left: 6 + ((i % columns) + 0.5) * (76 / columns) - 8 + (random() - 0.5) * 10,
      top: 6 + (Math.floor(i / columns) + 0.5) * (70 / rows) - 12 + (random() - 0.5) * 12,
      tilt: (random() - 0.5) * 2 * scatterTilt,
    }));
  }, [seed, total, scatterTilt]);

  const bringToFront = (index: number) => setOrder((current) => (current[current.length - 1] === index ? current : [...current.filter((i) => i !== index), index]));
  const toggle = (index: number) => {
    bringToFront(index);
    const next = enlarged === index ? null : index;
    setEnlarged(next);
    if (next !== null) onSelect?.(items[next], next);
  };

  return (
    <div
      ref={table}
      role="group"
      aria-label={ariaLabel}
      onKeyDown={(event) => {
        if (event.key === "Escape") setEnlarged(null);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) setEnlarged(null);
      }}
      className={cn("@container relative size-full min-h-[420px] overflow-hidden rounded-[inherit]", className)}
      style={{ backgroundColor, "--print": `${clamp(size, 0.1, 0.4) * 100}cqw`, ...style } as CSSProperties}
    >
      {enlarged !== null ? <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[999] bg-black/20" /> : null}
      {items.slice(0, total).map((item, i) => (
        <Print
          key={`${item.src}-${i}`}
          item={item}
          index={i}
          total={total}
          spot={spots[i]}
          table={table}
          z={order.indexOf(i) + 1}
          enlarged={enlarged === i}
          draggable={draggable}
          captions={captions}
          reduceMotion={reduceMotion}
          onFront={bringToFront}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}
