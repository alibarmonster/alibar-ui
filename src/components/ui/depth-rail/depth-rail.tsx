"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type AnimationPlaybackControls, type MotionValue } from "motion/react";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface DepthRailItem {
  id: string | number;
  title: string;
  subtitle?: string;
  /** Small extra line, e.g. a location or a year. */
  meta?: string;
  /** Image URL. */
  image: string;
  /** CSS object-position for the image, e.g. "50% 30%". */
  imagePosition?: string;
  /** Alt text; defaults to the title. */
  alt?: string;
}

export interface DepthRailProps<T extends DepthRailItem> {
  /** Cards on the rail; 6–12 work best. */
  items: T[];
  /** Accessible name of the carousel. */
  label: string;
  /** Front card (controlled). Pair with onIndexChange. */
  index?: number;
  /** Fires when the front card changes. */
  onIndexChange?: (index: number) => void;
  /** Front card on first render when uncontrolled. @default 0 */
  defaultIndex?: number;
  /** Custom caption under the rail, e.g. stats and a save button. Defaults to title, subtitle and meta. */
  renderCaption?: (item: T, index: number) => ReactNode;
  /** Classes for the root. */
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const SPREAD = 62;

/** Offset from the front card → horizontal position in % of a card width (outer cards pack tighter). */
const spread = (offset: number) => {
  const t = Math.abs(offset);
  return Math.sign(offset) * (t < 1 ? t * SPREAD : SPREAD + (t - 1) * 24);
};

function RailCard<T extends DepthRailItem>({
  item,
  index,
  total,
  front,
  position,
  reduced,
  onSelect,
}: {
  item: T;
  index: number;
  total: number;
  front: number;
  position: MotionValue<number>;
  reduced: MotionValue<number>;
  onSelect: (index: number) => void;
}) {
  // Every visual is a function of the rail position, so nothing re-renders while it moves.
  const x = useTransform(position, (p) => `${spread(index - p)}%`);
  const rotateY = useTransform([position, reduced], ([p, r]: number[]) => (r ? 0 : -Math.sign(index - p) * Math.min(Math.abs(index - p), 1) * 38));
  const z = useTransform(position, (p) => -Math.min(Math.abs(index - p), 1) * 120 - Math.max(0, Math.abs(index - p) - 1) * 50);
  const scale = useTransform(position, (p) => 1 - Math.min(Math.abs(index - p), 3) * 0.06);
  const shade = useTransform(position, (p) => Math.min(Math.abs(index - p), 3) * 0.16);
  const zIndex = useTransform(position, (p) => 100 - Math.round(Math.abs(index - p) * 10));
  const visibility = useTransform(position, (p) => (Math.abs(index - p) > 3.6 ? "hidden" : "visible"));
  const drift = useTransform([position, reduced], ([p, r]: number[]) => (r ? "0%" : `${clamp(index - p, -1.5, 1.5) * -5}%`));
  const isFront = index === front;
  return (
    <motion.div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${item.title}`}
      aria-hidden={!isFront}
      onClick={() => onSelect(index)}
      style={{ x, rotateY, z, scale, zIndex, visibility }}
      className={cn("absolute top-4 left-1/2 -ml-[calc(var(--card)/2)] aspect-[4/5] w-(--card) [transform-style:preserve-3d]", !isFront && "cursor-pointer")}
    >
      {/* Grounded shadow */}
      <div aria-hidden="true" className="absolute inset-x-[8%] -bottom-3 h-6 rounded-[50%] bg-black/30 blur-lg" />
      <div className="relative size-full overflow-hidden rounded-2xl bg-surface-2 shadow-[0_1px_2px_rgb(0_0_0/0.08),0_12px_32px_-12px_rgb(0_0_0/0.35)]">
        <motion.img
          src={item.image}
          alt={item.alt ?? item.title}
          draggable={false}
          style={{ x: drift, objectPosition: item.imagePosition }}
          className="absolute inset-y-0 -left-[7.5%] h-full w-[115%] max-w-none object-cover"
        />
        <motion.div aria-hidden="true" className="absolute inset-0 bg-black" style={{ opacity: shade }} />
      </div>
      {/* Quiet reflection: a flipped copy fading out under a gradient mask. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-full mt-2 h-[42%] overflow-hidden rounded-2xl opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]">
        <motion.img
          src={item.image}
          alt=""
          draggable={false}
          style={{ x: drift, objectPosition: item.imagePosition }}
          className="absolute top-0 -left-[7.5%] h-[238%] w-[115%] max-w-none -scale-y-100 object-cover"
        />
      </div>
    </motion.div>
  );
}

/**
 * A lightweight coverflow built from DOM, CSS 3D transforms and Motion values (no WebGL): the
 * front card stands forward while the rest recede, turn toward the center, dim and drift inside
 * their frames.
 */
export function DepthRail<T extends DepthRailItem>({ items, label, index, onIndexChange, defaultIndex = 0, renderCaption, className }: DepthRailProps<T>) {
  const count = items.length;
  const initial = clamp(Math.round(index ?? defaultIndex), 0, Math.max(0, count - 1));
  const position = useMotionValue(initial);
  // Reduced motion lives in a motion value set after mount, so server and client render the same styles.
  const reduced = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const [front, setFront] = useState(initial);
  const [direction, setDirection] = useState(1);
  const root = useRef<HTMLDivElement>(null);
  const target = useRef(initial);
  const frontRef = useRef(initial);
  const playback = useRef<AnimationPlaybackControls | null>(null);
  const drag = useRef({ id: -1, active: false, startX: 0, startPosition: 0, startTime: 0, dragged: false });

  useEffect(() => {
    reduced.set(reduceMotion ? 1 : 0);
  }, [reduceMotion, reduced]);

  const cardWidth = () => clamp((root.current?.clientWidth ?? 600) * 0.38, 168, 272);

  const goTo = useCallback(
    (next: number, velocity?: number) => {
      const destination = clamp(Math.round(next), 0, Math.max(0, count - 1));
      if (destination !== target.current) {
        target.current = destination;
        onIndexChange?.(destination);
      }
      playback.current?.stop();
      if (reduced.get()) {
        position.jump(destination);
        return;
      }
      // The spring starts at the release speed, so throws land smoothly.
      playback.current = animate(position, destination, { type: "spring", stiffness: 260, damping: 30, velocity: velocity ?? position.getVelocity() });
    },
    [count, onIndexChange, position, reduced],
  );

  // The front card follows the position (passing cards update the caption and the slide labels).
  useMotionValueEvent(position, "change", (p) => {
    const next = clamp(Math.round(p), 0, Math.max(0, count - 1));
    if (next === frontRef.current) return;
    setDirection(next > frontRef.current ? 1 : -1);
    frontRef.current = next;
    setFront(next);
    if (drag.current.active) {
      target.current = next;
      onIndexChange?.(next);
    }
  });

  // Controlled index: animate to it when it changes from outside.
  useEffect(() => {
    if (index !== undefined && index !== target.current) goTo(index, 0);
  }, [index, goTo]);

  // Sideways trackpad scroll moves the rail directly, then settles with momentum.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let timer = 0;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      playback.current?.stop();
      const max = Math.max(0, count - 1);
      const raw = position.get() + event.deltaX / (cardWidth() * (SPREAD / 100));
      position.set(raw < 0 ? raw * 0.35 : raw > max ? max + (raw - max) * 0.35 : raw);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => goTo(position.get() + position.getVelocity() * 0.15), 120);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", onWheel);
      window.clearTimeout(timer);
    };
  }, [count, goTo, position]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { id: event.pointerId, active: false, startX: event.clientX, startPosition: position.get(), startTime: performance.now(), dragged: false };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (state.id !== event.pointerId) return;
    const dx = event.clientX - state.startX;
    if (!state.active) {
      if (Math.abs(dx) < 6) return;
      state.active = true;
      state.dragged = true;
      playback.current?.stop();
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const max = Math.max(0, count - 1);
    const raw = state.startPosition - dx / (cardWidth() * (SPREAD / 100));
    // Rubber band past the first and last card.
    position.set(raw < 0 ? raw * 0.35 : raw > max ? max + (raw - max) * 0.35 : raw);
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (state.id !== event.pointerId) return;
    state.id = -1;
    if (!state.active) return;
    state.active = false;
    const p = position.get();
    const velocity = clamp(position.getVelocity(), -25, 25);
    let next = Math.round(p + velocity * 0.22);
    const from = Math.round(state.startPosition);
    // A quick flick always moves at least one card.
    const quick = performance.now() - state.startTime < 300 && Math.abs(p - state.startPosition) > 0.08;
    if (next === from && (Math.abs(velocity) > 0.8 || quick)) next = from + Math.sign(Math.abs(velocity) > 0.8 ? velocity : p - state.startPosition);
    goTo(next, velocity);
  };
  const onClickCapture = (event: MouseEvent) => {
    // A drag never counts as a click on a card.
    if (drag.current.dragged) {
      event.stopPropagation();
      drag.current.dragged = false;
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: target.current + 1, ArrowLeft: target.current - 1, Home: 0, End: count - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    goTo(keys[event.key]);
  };

  const item = items[front];
  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn("@container relative w-full rounded-2xl outline-none select-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        className="relative h-[calc(var(--card)*1.25+var(--card)*0.55+1rem)] touch-pan-y overflow-hidden [--card:clamp(168px,38cqw,272px)] [perspective:1100px]"
      >
        {items.map((entry, i) => (
          <RailCard key={entry.id} item={entry} index={i} total={count} front={front} position={position} reduced={reduced} onSelect={(n) => n !== target.current && goTo(n)} />
        ))}
      </div>
      <div className="relative mx-auto mt-1 min-h-14 max-w-sm overflow-hidden px-4 text-center">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={front}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: reduceMotion ? 0 : 18 * d, y: reduceMotion ? 0 : 6 }),
              center: { opacity: 1, x: 0, y: 0 },
              exit: (d: number) => ({ opacity: 0, x: reduceMotion ? 0 : -18 * d }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? duration.quick : duration.base, ease: ease.out }}
          >
            {item ? (
              renderCaption ? (
                renderCaption(item, front)
              ) : (
                <>
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  {item.subtitle || item.meta ? (
                    <p className="truncate text-[13px] text-muted-foreground">{[item.subtitle, item.meta].filter(Boolean).join(" · ")}</p>
                  ) : null}
                </>
              )
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Position ticks: clickable, but out of the tab order (the rail itself handles the keys). */}
      <div aria-hidden="true" className="mt-2 flex justify-center gap-1.5">
        {items.map((entry, i) => (
          <button
            key={entry.id}
            type="button"
            tabIndex={-1}
            onClick={() => goTo(i)}
            className={cn("h-1.5 cursor-pointer rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none", i === front ? "w-5 bg-foreground" : "w-1.5 bg-foreground/20 hover:bg-foreground/40")}
          />
        ))}
      </div>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {item ? `${front + 1} of ${count}: ${item.title}` : ""}
      </p>
    </div>
  );
}
