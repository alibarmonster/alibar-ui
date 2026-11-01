"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue, type PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ParallaxLayer {
  /** Layer content, e.g. part of an illustration. */
  content: ReactNode;
  /** 0 moves with the slide, 1 stays put; the far background usually sits around 0.6. */
  depth: number;
}

export interface ParallaxSlide {
  /** Stable identity. */
  id: string;
  /** Slide name, used for the slide's accessible label. */
  label: string;
  /** Background layers, back to front. */
  layers: ParallaxLayer[];
  /** Foreground content (e.g. a heading); it travels a little faster than the slide. */
  children?: ReactNode;
}

export interface ParallaxSliderProps
  extends Omit<ComponentProps<"section">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Slides, in order. */
  slides: ParallaxSlide[];
  /** Controlled index of the current slide. */
  index?: number;
  /** Initial slide when uncontrolled. @default 0 */
  defaultIndex?: number;
  /** Called when the current slide changes. */
  onIndexChange?: (index: number) => void;
  /** How much faster the foreground travels than the slide (negative depth). @default 0.3 */
  foregroundSpeed?: number;
}

const SNAP = { type: "spring", stiffness: 260, damping: 34 } as const;

function Layer({ progress, width, depth, children }: { progress: MotionValue<number>; width: number; depth: number; children: ReactNode }) {
  // As the slide moves by one width, this layer moves back by depth × width: it lags behind, so it looks farther away.
  const x = useTransform(progress, (p) => -p * width * depth);
  return (
    <motion.div className="absolute inset-y-0 -right-1/2 -left-1/2" style={{ x }}>
      {children}
    </motion.div>
  );
}

function Slide({
  slide,
  i,
  count,
  track,
  width,
  active,
  foregroundSpeed,
  reduceMotion,
}: {
  slide: ParallaxSlide;
  i: number;
  count: number;
  track: MotionValue<number>;
  width: number;
  active: boolean;
  foregroundSpeed: number;
  reduceMotion: boolean;
}) {
  // 0 when this slide is centered, −1 when it has moved one slide to the left, +1 to the right.
  const progress = useTransform(track, (x) => (width ? (x + i * width) / width : 0));
  const textX = useTransform(progress, (p) => (reduceMotion ? 0 : p * width * foregroundSpeed));
  const textOpacity = useTransform(progress, (p) => 1 - Math.min(1, Math.abs(p) * 1.4));

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${i + 1} of ${count}: ${slide.label}`}
      aria-hidden={!active || undefined}
      inert={!active || undefined}
      className="relative h-full w-full shrink-0 overflow-hidden"
    >
      {slide.layers.map((layer, l) => (
        <Layer key={l} progress={progress} width={width} depth={reduceMotion ? 0 : layer.depth}>
          {layer.content}
        </Layer>
      ))}
      {slide.children ? (
        <motion.div className="absolute inset-0" style={{ x: textX, opacity: textOpacity }}>
          {slide.children}
        </motion.div>
      ) : null}
    </div>
  );
}

export function ParallaxSlider({
  slides,
  index,
  defaultIndex = 0,
  onIndexChange,
  foregroundSpeed = 0.3,
  className,
  "aria-label": ariaLabel = "Slides",
  ...props
}: ParallaxSliderProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [internal, setInternal] = useState(defaultIndex);
  const current = Math.min(Math.max(index ?? internal, 0), slides.length - 1);
  const [width, setWidth] = useState(0);
  const track = useMotionValue(0);
  const liveId = useId();

  // Links and images inside start the browser's own drag-and-drop, which would cancel the swipe.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const block = (event: DragEvent) => event.preventDefault();
    el.addEventListener("dragstart", block);
    return () => el.removeEventListener("dragstart", block);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.offsetWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keep the track on the current slide (on resize, and when a controlled index changes).
  useEffect(() => {
    if (!width) return;
    const controls = animate(track, -current * width, reduceMotion ? { duration: 0 } : SNAP);
    return () => controls.stop();
  }, [current, width, reduceMotion, track]);

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), slides.length - 1);
    if (index === undefined) setInternal(clamped);
    onIndexChange?.(clamped);
    // Re-snap even when the index doesn't change (e.g. a short drag).
    if (clamped === current && width) animate(track, -clamped * width, reduceMotion ? { duration: 0 } : SNAP);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const projected = -track.get() - info.velocity.x * 0.25;
    go(Math.round(projected / (width || 1)));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") go(current + 1);
    else if (event.key === "ArrowLeft") go(current - 1);
    else return;
    event.preventDefault();
  };

  const arrow =
    "inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40";

  return (
    <section aria-roledescription="carousel" aria-label={ariaLabel} onKeyDown={onKeyDown} className={cn("w-full", className)} {...props}>
      <div ref={viewportRef} className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted sm:aspect-[16/8]">
        <motion.div
          className="flex h-full cursor-grab touch-pan-y active:cursor-grabbing"
          style={{ x: track }}
          drag="x"
          dragConstraints={{ left: -(slides.length - 1) * width, right: 0 }}
          dragElastic={0.14}
          dragMomentum={false}
          onDragEnd={onDragEnd}
        >
          {slides.map((slide, i) => (
            <Slide
              key={slide.id}
              slide={slide}
              i={i}
              count={slides.length}
              track={track}
              width={width}
              active={i === current}
              foregroundSpeed={foregroundSpeed}
              reduceMotion={reduceMotion}
            />
          ))}
        </motion.div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5" role="group" aria-label="Choose slide">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}: ${slide.label}`}
              aria-current={i === current || undefined}
              className="group flex h-6 cursor-pointer items-center outline-none"
            >
              <motion.span
                className="block h-1.5 rounded-full bg-foreground group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2"
                initial={false}
                animate={{ width: i === current ? 22 : 6, opacity: i === current ? 1 : 0.25 }}
                transition={reduceMotion ? { duration: 0 } : SNAP}
              />
            </button>
          ))}
        </div>
        <p id={liveId} className="sr-only" aria-live="polite">
          Slide {current + 1} of {slides.length}: {slides[current]?.label}
        </p>
        <div className="flex gap-2">
          <button type="button" className={arrow} onClick={() => go(current - 1)} disabled={current === 0} aria-label="Previous slide">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button type="button" className={arrow} onClick={() => go(current + 1)} disabled={current === slides.length - 1} aria-label="Next slide">
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
