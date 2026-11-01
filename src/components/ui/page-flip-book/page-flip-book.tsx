"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type AnimationPlaybackControls, type MotionValue } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/lib/gallery/types";

export interface PageFlipBookProps {
  /** Pages in order: the first is the cover (alone on the right), then two per spread. */
  items: GalleryItem[];
  /** Spread shown first (0 is the cover). @default 0 */
  startSpread?: number;
  /** Page width ÷ height. @default 0.72 */
  aspect?: number;
  /** How much a turning page curls, 0–1. @default 0.6 */
  curl?: number;
  /** Vertical strips that make up a turning page; more is smoother. @default 14 */
  strips?: number;
  /** Shadow strength along the spine and under a turning page, 0–1. @default 0.6 */
  shadow?: number;
  /** Drag a page corner to turn it. @default true */
  draggable?: boolean;
  /** Previous / next buttons with the page numbers. @default true */
  controls?: boolean;
  /** Page titles under the spread. @default true */
  captions?: boolean;
  /** Background behind the book. @default "transparent" */
  backgroundColor?: string;
  /** Accessible name of the book. @default "Book" */
  ariaLabel?: string;
  /** Classes for the root. */
  className?: string;
  /** Inline styles for the root. */
  style?: CSSProperties;
  /** Fires with the new spread index after a page turns. */
  onSpreadChange?: (spread: number) => void;
}

type Turn = { leaf: number; forward: boolean } | null;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** One vertical strip of the turning leaf. Strips nest, each bending a little more, which reads as a curl. */
function Strip({
  index,
  strips,
  progress,
  curl,
  front,
  back,
}: {
  index: number;
  strips: number;
  progress: MotionValue<number>;
  curl: number;
  front?: string;
  back?: string;
}) {
  const bendPerStrip = (curl * 80) / strips;
  // The first strip turns around the spine; every later strip bends relative to the previous one.
  const rotateY = useTransform(progress, (u) => (index === 0 ? -180 * u : Math.sin(Math.PI * u) * bendPerStrip));
  const angle = useTransform(progress, (u) => -180 * u + index * Math.sin(Math.PI * u) * bendPerStrip);
  const shadeFront = useTransform(angle, (a) => (1 - Math.max(0, Math.cos((a * Math.PI) / 180))) * 0.35);
  const shadeBack = useTransform(angle, (a) => (1 - Math.max(0, -Math.cos((a * Math.PI) / 180))) * 0.35);
  const slice = (i: number) => `calc(var(--page-w) / ${strips} * ${-i})`;
  return (
    <motion.div
      className={cn("absolute top-0 h-full [transform-style:preserve-3d]", index === 0 ? "left-0" : "left-full")}
      style={{ width: `calc(var(--page-w) / ${strips} + 0.5px)`, rotateY, transformOrigin: "left center" }}
    >
      <div
        className="absolute inset-0 bg-zinc-100 [backface-visibility:hidden]"
        style={{ backgroundImage: front ? `url("${front}")` : undefined, backgroundSize: "var(--page-w) var(--page-h)", backgroundPosition: `${slice(index)} 0` }}
      >
        <motion.div className="absolute inset-0 bg-black" style={{ opacity: shadeFront }} />
      </div>
      <div
        className="absolute inset-0 bg-zinc-100 [backface-visibility:hidden] [transform:rotateY(180deg)]"
        style={{ backgroundImage: back ? `url("${back}")` : undefined, backgroundSize: "var(--page-w) var(--page-h)", backgroundPosition: `${slice(strips - 1 - index)} 0` }}
      >
        <motion.div className="absolute inset-0 bg-black" style={{ opacity: shadeBack }} />
      </div>
      {index < strips - 1 ? <Strip index={index + 1} strips={strips} progress={progress} curl={curl} front={front} back={back} /> : null}
    </motion.div>
  );
}

function Page({ item, side, spine }: { item?: GalleryItem; side: "left" | "right"; spine: number }) {
  if (!item) return <div className="h-full w-(--page-w)" />;
  return (
    <div className="relative h-full w-(--page-w) overflow-hidden bg-zinc-100 shadow-[0_1px_3px_rgb(0_0_0/0.12)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic */}
      <img src={item.src} alt="" draggable={false} className="pointer-events-none size-full object-cover" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(${side === "left" ? "to left" : "to right"}, rgba(0,0,0,${0.32 * spine}), rgba(0,0,0,0) 14%)` }}
      />
    </div>
  );
}

/**
 * A book whose pages turn with a curl when dragged or clicked, with a shadow along the spine.
 * The turning leaf is a chain of CSS 3D strips, each bending a little more than the last.
 */
export function PageFlipBook({
  items,
  startSpread = 0,
  aspect = 0.72,
  curl = 0.6,
  strips = 14,
  shadow = 0.6,
  draggable = true,
  controls = true,
  captions = true,
  backgroundColor = "transparent",
  ariaLabel = "Book",
  className,
  style,
  onSpreadChange,
}: PageFlipBookProps) {
  // The cover is alone on the right, so the last page lands on spread ceil((n - 1) / 2).
  const lastSpread = Math.max(0, Math.ceil((items.length - 1) / 2));
  const [spread, setSpread] = useState(clamp(startSpread, 0, lastSpread));
  const [turn, setTurn] = useState<Turn>(null);
  const progress = useMotionValue(0);
  const castShadow = useTransform(progress, (u) => Math.sin(Math.PI * u) * 0.35 * clamp(shadow, 0, 1));
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const playback = useRef<AnimationPlaybackControls | null>(null);
  const drag = useRef({ id: -1, startX: 0, active: false, moved: false, forward: true });
  const sliceCount = clamp(Math.round(strips), 4, 32);

  const page = (index: number) => (index >= 0 && index < items.length ? items[index] : undefined);
  const canNext = spread < lastSpread;
  const canPrevious = spread > 0;

  const finish = (forward: boolean, completed: boolean) => {
    if (completed) {
      const next = spread + (forward ? 1 : -1);
      setSpread(next);
      onSpreadChange?.(next);
    }
    setTurn(null);
    progress.jump(0);
  };

  const runTurn = (forward: boolean, from: number, velocity = 0) => {
    const leaf = forward ? spread : spread - 1;
    setTurn({ leaf, forward });
    if (reduceMotion) return finish(forward, true);
    playback.current?.stop();
    progress.jump(from);
    const to = forward ? 1 : 0;
    playback.current = animate(progress, to, { type: "spring", stiffness: 120, damping: 20, velocity, onComplete: () => finish(forward, true) });
  };

  const settle = (forward: boolean, velocity: number) => {
    const u = progress.get();
    const complete = forward ? u > 0.5 || velocity > 1.2 : u < 0.5 || velocity < -1.2;
    playback.current?.stop();
    if (reduceMotion) return finish(forward, complete);
    playback.current = animate(progress, complete === forward ? 1 : 0, {
      type: "spring",
      stiffness: 140,
      damping: 22,
      velocity,
      onComplete: () => finish(forward, complete),
    });
  };

  const goNext = () => canNext && !turn && runTurn(true, 0);
  const goPrevious = () => canPrevious && !turn && runTurn(false, 1);

  // Keep the leaf in the right place when the spread changes from outside a turn.
  useEffect(() => () => playback.current?.stop(), []);

  const pageWidth = () => (root.current?.querySelector<HTMLElement>("[data-book]")?.clientWidth ?? 600) / 2;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggable || turn || (event.pointerType === "mouse" && event.button !== 0)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const forward = event.clientX > rect.left + rect.width / 2;
    if ((forward && !canNext) || (!forward && !canPrevious)) return;
    drag.current = { id: event.pointerId, startX: event.clientX, active: false, moved: false, forward };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (state.id !== event.pointerId) return;
    const dx = event.clientX - state.startX;
    if (!state.active) {
      if (Math.abs(dx) < 6) return;
      state.active = true;
      state.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setTurn({ leaf: state.forward ? spread : spread - 1, forward: state.forward });
    }
    const width = pageWidth() * 2;
    progress.set(state.forward ? clamp(-dx / width, 0, 1) : clamp(1 - dx / width, 0, 1));
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (state.id !== event.pointerId) return;
    state.id = -1;
    if (state.active) {
      settle(state.forward, progress.getVelocity());
      return;
    }
    // A click on either half turns that way.
    if (state.forward) goNext();
    else goPrevious();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrevious();
    } else if ((event.key === "Home" || event.key === "End") && !turn) {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : lastSpread;
      setSpread(next);
      onSpreadChange?.(next);
    }
  };

  // What lies under the turning leaf, and the leaf's two faces.
  const forward = turn?.forward ?? true;
  const leftIndex = turn ? (forward ? 2 * spread - 1 : 2 * spread - 3) : 2 * spread - 1;
  const rightIndex = turn ? (forward ? 2 * spread + 2 : 2 * spread) : 2 * spread;
  const leafFront = turn ? page(2 * turn.leaf) : undefined;
  const leafBack = turn ? page(2 * turn.leaf + 1) : undefined;
  const visible = [page(2 * spread - 1), page(2 * spread)].filter(Boolean) as GalleryItem[];
  const numbers = [2 * spread - 1, 2 * spread].filter((i) => i >= 0 && i < items.length).map((i) => i + 1);

  return (
    <div
      ref={root}
      className={cn("@container flex w-full flex-col items-center gap-3", className)}
      style={{ backgroundColor, ...style }}
    >
      <div
        data-book
        role="group"
        aria-roledescription="book"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative flex touch-pan-y rounded-md outline-none select-none [perspective:1800px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
        style={{ "--page-w": "min(46cqw, 300px)", "--page-h": `calc(min(46cqw, 300px) / ${aspect})`, height: "var(--page-h)" } as CSSProperties}
      >
        <Page item={page(leftIndex)} side="left" spine={shadow} />
        <div className="relative">
          <Page item={page(rightIndex)} side="right" spine={shadow} />
          {/* The leaf's shadow on the page underneath. */}
          {turn ? <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,1),rgba(0,0,0,0)_70%)]" style={{ opacity: castShadow }} /> : null}
          {turn ? (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]">
              <Strip index={0} strips={sliceCount} progress={progress} curl={clamp(curl, 0, 1)} front={leafFront?.src} back={leafBack?.src} />
            </div>
          ) : null}
        </div>
        {/* Screen readers get the visible pages as text. */}
        <ul className="sr-only">
          {visible.map((item) => (
            <li key={item.src}>{[item.title, item.subtitle, item.alt].filter(Boolean).join(". ")}</li>
          ))}
        </ul>
      </div>
      {captions ? (
        <div aria-hidden="true" className="flex w-[calc(min(46cqw,300px)*2)] max-w-full justify-between text-[12px] text-muted-foreground">
          <span className="truncate">{page(2 * spread - 1)?.title ?? ""}</span>
          <span className="truncate">{page(2 * spread)?.title ?? ""}</span>
        </div>
      ) : null}
      {controls ? (
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous page" disabled={!canPrevious || Boolean(turn)} onClick={goPrevious} className="grid size-10 cursor-pointer place-items-center rounded-full border border-border bg-background text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <span className="min-w-28 text-center font-mono text-[13px] text-muted-foreground tabular-nums">
            {numbers.length === 2 ? `Pages ${numbers[0]}–${numbers[1]}` : `Page ${numbers[0] ?? 1}`} of {items.length}
          </span>
          <button type="button" aria-label="Next page" disabled={!canNext || Boolean(turn)} onClick={goNext} className="grid size-10 cursor-pointer place-items-center rounded-full border border-border bg-background text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35">
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {numbers.length === 2 ? `Pages ${numbers[0]} and ${numbers[1]}` : `Page ${numbers[0] ?? 1}`} of {items.length}
        {visible.length ? `: ${visible.map((item) => item.title ?? item.alt).join(", ")}` : ""}
      </p>
    </div>
  );
}
