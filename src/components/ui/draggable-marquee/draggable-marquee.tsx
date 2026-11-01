"use client";

import { Children, useEffect, useRef, useState, type ComponentProps, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DraggableMarqueeProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Items in the loop; each child becomes one list item. */
  children: ReactNode;
  /** Scroll speed in px per second. @default 40 */
  speed?: number;
  /** Which way the loop travels. @default "left" */
  direction?: "left" | "right";
  /** Space between items in px. @default 16 */
  gap?: number;
  /** Slow to a stop while hovered or while focus is inside. @default true */
  pauseOnHover?: boolean;
  /** Let people drag (or swipe) to scrub; a flick carries on and eases back to speed. @default true */
  draggable?: boolean;
  /** Fade items out at both edges. @default true */
  fade?: boolean;
  /** Show a pause/play button (recommended for loops that run long). @default false */
  showControls?: boolean;
}

const EDGE_FADE = "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)";

export function DraggableMarquee({
  children,
  speed = 40,
  direction = "left",
  gap = 16,
  pauseOnHover = true,
  draggable = true,
  fade = true,
  showControls = false,
  className,
  style,
  "aria-label": ariaLabel = "Scrolling list",
  ...props
}: DraggableMarqueeProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLUListElement>(null);
  const inView = useInView(rootRef);
  const [width, setWidth] = useState(0);
  const [copies, setCopies] = useState(2);
  const [paused, setPaused] = useState(false);
  const x = useMotionValue(0);
  const velocity = useRef(0);
  const hold = useRef({ hover: false, focus: false });
  const drag = useRef({ pending: false, active: false, moved: 0, lastX: 0, lastT: 0, v: 0 });
  const items = Children.toArray(children);

  // Links and images inside start the browser's own drag-and-drop, which would cancel the swipe.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const block = (event: DragEvent) => event.preventDefault();
    el.addEventListener("dragstart", block);
    return () => el.removeEventListener("dragstart", block);
  }, []);

  // One copy's width (items + trailing gap), and enough copies to cover the viewport with one to spare.
  useEffect(() => {
    const root = rootRef.current;
    const copy = copyRef.current;
    if (!root || !copy) return;
    const measure = () => {
      setWidth(copy.offsetWidth);
      setCopies(Math.max(2, Math.ceil(root.offsetWidth / Math.max(copy.offsetWidth, 1)) + 1));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(copy);
    return () => observer.disconnect();
  }, []);

  // Keep x within one copy's width, so the loop never runs out.
  const wrap = (value: number) => (width ? ((value % width) - width) % width : value);

  useAnimationFrame((_, delta) => {
    if (!width || reduceMotion || !inView || drag.current.active) return;
    const dt = Math.min(delta, 64) / 1000;
    const holding = paused || (pauseOnHover && (hold.current.hover || hold.current.focus));
    const target = holding ? 0 : direction === "left" ? -speed : speed;
    // Ease toward the target speed: pauses glide to a stop, and a flick's momentum bleeds off.
    velocity.current += (target - velocity.current) * Math.min(1, dt * 2.5);
    x.set(wrap(x.get() + velocity.current * dt));
  });

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggable || reduceMotion || event.button !== 0) return;
    // Don't capture yet: a press without movement must still click the link or button underneath.
    drag.current = { pending: true, active: false, moved: 0, lastX: event.clientX, lastT: performance.now(), v: 0 };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.pending && !d.active) {
      if (Math.abs(event.clientX - d.lastX) < 4) return;
      d.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!d.active) return;
    const now = performance.now();
    const dx = event.clientX - d.lastX;
    d.moved += Math.abs(dx);
    d.v = d.v * 0.6 + (dx / Math.max(now - d.lastT, 1)) * 1000 * 0.4;
    d.lastX = event.clientX;
    d.lastT = now;
    x.set(wrap(x.get() + dx));
  };
  const endDrag = () => {
    drag.current.pending = false;
    if (!drag.current.active) return;
    drag.current.active = false;
    velocity.current = Math.max(-2400, Math.min(2400, drag.current.v));
  };

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label={ariaLabel}
      className={cn(
        "relative overflow-hidden motion-reduce:overflow-x-auto",
        draggable && "cursor-grab touch-pan-y select-none active:cursor-grabbing motion-reduce:cursor-auto",
        className,
      )}
      style={{ ...style, ...(fade ? { maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE } : {}) }}
      onPointerEnter={(event) => event.pointerType === "mouse" && (hold.current.hover = true)}
      onPointerLeave={() => (hold.current.hover = false)}
      onFocus={() => (hold.current.focus = true)}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && (hold.current.focus = false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      // A drag shouldn't count as a click on whatever item it started on.
      onClickCapture={(event: MouseEvent) => {
        if (drag.current.moved > 6) {
          event.preventDefault();
          event.stopPropagation();
          drag.current.moved = 0;
        }
      }}
      {...props}
    >
      <motion.div className="flex w-max" style={{ x }}>
        {Array.from({ length: copies }, (_, copy) => (
          // Only the first copy is exposed to assistive tech; the rest exist to make the loop seamless.
          <ul
            key={copy}
            ref={copy === 0 ? copyRef : undefined}
            aria-hidden={copy > 0 || undefined}
            inert={copy > 0 || undefined}
            className={cn("flex shrink-0 items-center", copy > 0 && "motion-reduce:hidden")}
            style={{ gap, paddingRight: gap }}
          >
            {items.map((item, i) => (
              <li key={i} className="shrink-0">
                {item}
              </li>
            ))}
          </ul>
        ))}
      </motion.div>
      {showControls ? (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play" : "Pause"}
          aria-pressed={paused}
          className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm backdrop-blur outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hidden"
        >
          {paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  );
}
