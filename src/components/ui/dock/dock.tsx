"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import {
  AnimatePresence,
  motion,
  useAnimate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface DockItem {
  /** Unique id. */
  id: string;
  /** Tooltip text and accessible name. */
  label: string;
  /** Icon content, usually a lucide icon. */
  icon: ReactNode;
  /** Classes for the icon tile, e.g. a gradient background. */
  className?: string;
  /** Renders the item as a link. */
  href?: string;
  /** Click handler for button items. */
  onClick?: () => void;
  /** Shows a running indicator under the icon. */
  active?: boolean;
}

export interface DockProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** The dock items, in order. */
  items: DockItem[];
  /** Resting icon size in px. @default 48 */
  iconSize?: number;
  /** Scale of the icon right under the cursor. @default 1.7 */
  magnification?: number;
  /** Distance in px over which neighbours also grow. @default 140 */
  distance?: number;
}

const GAP = 8;
const HOVER_SPRING = { stiffness: 320, damping: 30, mass: 0.6 };

/** Smooth bell curve: 1 under the cursor, 0 at `distance` and beyond. */
function influence(offset: number, distance: number) {
  const t = Math.min(Math.abs(offset) / distance, 1);
  return 0.5 + 0.5 * Math.cos(Math.PI * t);
}

interface DockState {
  pointerX: MotionValue<number>;
  hover: MotionValue<number>;
  centers: RefObject<number[]>;
  iconSize: number;
  magnification: number;
  distance: number;
}

function scaleOf(state: DockState, center: number, x: number, h: number) {
  return 1 + (state.magnification - 1) * influence(x - center, state.distance) * h;
}

/** How far item `index` shifts so magnified neighbours never overlap and the row stays centered. */
function offsetOf(state: DockState, index: number, x: number, h: number) {
  const centers = state.centers.current;
  let before = 0;
  let total = 0;
  for (let j = 0; j < centers.length; j++) {
    const extra = state.iconSize * (scaleOf(state, centers[j], x, h) - 1);
    total += extra;
    if (j < index) before += extra;
    if (j === index) before += extra / 2;
  }
  return before - total / 2;
}

function DockIcon({
  item,
  index,
  state,
  focusable,
  onFocusItem,
  onBlurItem,
  itemRef,
}: {
  item: DockItem;
  index: number;
  state: DockState;
  focusable: boolean;
  onFocusItem: (index: number) => void;
  onBlurItem: () => void;
  itemRef: (node: HTMLElement | null) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [bounce, animateBounce] = useAnimate<HTMLSpanElement>();
  const scale = useTransform([state.pointerX, state.hover], ([x, h]: number[]) =>
    reduceMotion ? 1 : scaleOf(state, state.centers.current[index] ?? 0, x, h),
  );
  const x = useTransform([state.pointerX, state.hover], ([px, h]: number[]) => (reduceMotion ? 0 : offsetOf(state, index, px, h)));
  const tooltipY = useTransform(scale, (s) => -(s - 1) * state.iconSize);

  const Tag = item.href ? "a" : "button";
  const showLabel = hovered || focused;

  return (
    <motion.div style={{ x, width: state.iconSize, height: state.iconSize }} className="relative shrink-0">
      <AnimatePresence>
        {showLabel ? (
          <motion.span
            aria-hidden="true"
            style={{ y: tooltipY }}
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 -translate-x-1/2"
          >
            <motion.span
              initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: duration.instant } }}
              transition={{ duration: duration.quick, ease: ease.out }}
              className="block rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background shadow-md"
            >
              {item.label}
            </motion.span>
          </motion.span>
        ) : null}
      </AnimatePresence>
      <Tag
        ref={itemRef as never}
        href={item.href}
        type={item.href ? undefined : "button"}
        aria-label={item.label}
        tabIndex={focusable ? 0 : -1}
        onClick={() => {
          item.onClick?.();
          // A small launch bounce, like a dock icon opening its app.
          if (!reduceMotion && bounce.current) animateBounce(bounce.current, { y: [0, -16, 0, -6, 0] }, { duration: 0.6, ease: "easeOut" });
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => {
          setFocused(true);
          onFocusItem(index);
        }}
        onBlur={() => {
          setFocused(false);
          onBlurItem();
        }}
        className="group block size-full rounded-[22%] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span ref={bounce} className="block size-full">
          <motion.span
            style={{ scale, originY: 1 }}
            className={cn(
              "flex size-full items-center justify-center rounded-[22%] border border-border bg-background text-foreground shadow-sm [&_svg]:size-[45%]",
              item.className,
            )}
          >
            {item.icon}
          </motion.span>
        </span>
      </Tag>
      {item.active ? (
        <span aria-hidden="true" className="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground/70" />
      ) : null}
    </motion.div>
  );
}

export function Dock({
  items,
  iconSize = 48,
  magnification = 1.7,
  distance = 140,
  className,
  "aria-label": ariaLabel = "Dock",
  ...props
}: DockProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const centers = useRef<number[]>([]);
  const pointerX = useMotionValue(0);
  const hoverTarget = useMotionValue(0);
  const hover = useSpring(hoverTarget, HOVER_SPRING);
  const [focusIndex, setFocusIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const state: DockState = { pointerX, hover, centers, iconSize, magnification, distance };

  // Item centers in the list's own coordinates. Transforms don't change layout, so these stay valid.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      centers.current = Array.from(list.children as HTMLCollectionOf<HTMLElement>).map((el) => el.offsetLeft + el.offsetWidth / 2);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [items.length, iconSize]);

  // The background widens with the magnified icons by clipping a wider layer.
  const pad = iconSize * (magnification - 1) * 1.6;
  const inset = useTransform([pointerX, hover], ([x, h]: number[]) => {
    if (reduceMotion) return pad;
    let total = 0;
    for (const c of centers.current) total += iconSize * (scaleOf(state, c, x, h) - 1);
    return Math.max(0, pad - total / 2);
  });
  // clip-path cuts away borders and box-shadows, so the 1px border is a second clipped layer
  // peeking out around the fill, and the shadow is a drop-shadow on their shared wrapper.
  const borderClip = useTransform(inset, (i) => `inset(0px ${i}px round 18px)`);
  const fillClip = useTransform(inset, (i) => `inset(1px ${i + 1}px round 17px)`);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = {
      ArrowRight: (focusIndex + 1) % items.length,
      ArrowLeft: (focusIndex - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    itemRefs.current[moves[event.key]]?.focus();
  }

  return (
    <div className={cn("relative inline-flex", className)} {...props}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0"
        style={{ left: -pad, right: -pad, filter: "drop-shadow(0 10px 24px rgb(0 0 0 / 0.08)) drop-shadow(0 2px 6px rgb(0 0 0 / 0.05))" }}
      >
        <motion.div className="absolute inset-0 bg-border" style={{ clipPath: borderClip }} />
        <motion.div className="absolute inset-0 bg-background" style={{ clipPath: fillClip }} />
      </div>
      {/* A toolbar of buttons (not a list: the toolbar role would leave list items orphaned). */}
      <div
        ref={listRef}
        role="toolbar"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        onPointerMove={(event) => {
          const list = listRef.current;
          if (event.pointerType !== "mouse" || !list) return;
          // Centers are layout px; divide out any ancestor scale so the two agree.
          const rect = list.getBoundingClientRect();
          pointerX.set(((event.clientX - rect.left) * list.offsetWidth) / (rect.width || 1));
          hoverTarget.set(1);
        }}
        onPointerLeave={() => hoverTarget.set(0)}
        className="relative flex items-end px-2.5 pt-2.5 pb-2.5"
        style={{ gap: GAP }}
      >
        {items.map((item, index) => (
          <DockIcon
            key={item.id}
            item={item}
            index={index}
            state={state}
            focusable={index === focusIndex}
            itemRef={(node) => {
              itemRefs.current[index] = node;
            }}
            onFocusItem={(i) => {
              setFocusIndex(i);
              // Keyboard focus magnifies the focused icon as if the cursor were over it.
              pointerX.set(centers.current[i] ?? 0);
              hoverTarget.set(1);
            }}
            onBlurItem={() => {
              if (!listRef.current?.matches(":hover")) hoverTarget.set(0);
            }}
          />
        ))}
      </div>
    </div>
  );
}
