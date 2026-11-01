"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type AnimationPlaybackControls, type MotionValue } from "motion/react";
import { RollingDigits } from "@/components/ui/rolling-digits/rolling-digits";
import { cn } from "@/lib/utils";

export interface LensTab {
  value: string;
  label: string;
  /** Outline icon shown outside the lens. */
  icon: ReactNode;
  /** Filled icon shown inside the lens. @default icon */
  activeIcon?: ReactNode;
  /** Numeric badge (rolls when it changes); 0 or undefined hides it. */
  badge?: number;
  /** Spoken badge text added to the tab's name, e.g. "3 unread". */
  badgeLabel?: string;
}

export interface LensTabBarProps {
  /** Tabs, in order. */
  tabs: LensTab[];
  /** Selected tab value. */
  value: string;
  /** Fires with the newly selected value. */
  onValueChange: (value: string) => void;
  /** Which labels show: only the selected tab's ("active"), all of them, or none. @default "active" */
  labels?: "active" | "always" | "none";
  /** Accessible name of the tab list. @default "Sections" */
  label?: string;
  /** Base id for tabs and panels; wire panels with lensTabId and lensPanelId. @default a generated id */
  id?: string;
  /** Classes for the bar. */
  className?: string;
}

/** Id of a tab, for a panel's aria-labelledby. */
export const lensTabId = (id: string, value: string) => `${id}-tab-${value}`;
/** Id of a panel, which the tab's aria-controls points at. */
export const lensPanelId = (id: string, value: string) => `${id}-panel-${value}`;

const SLOT = 44;
const LABEL_GAP = 4;
const LABEL_END = 12;
const PAD = 4;
const SPRING = { type: "spring", stiffness: 380, damping: 36 } as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Slot positions and the lens for a fractional position: one function, so every part moves as one. */
function geometry(p: number, widths: number[], labels: LensTabBarProps["labels"]) {
  const count = widths.length;
  const open = (i: number) => (labels === "always" ? 1 : labels === "none" ? 0 : Math.max(0, 1 - Math.abs(clamp(p, 0, count - 1) - i)));
  const xs: number[] = [];
  const sizes: number[] = [];
  let x = PAD;
  for (let i = 0; i < count; i++) {
    const size = SLOT + open(i) * (widths[i] + LABEL_GAP + LABEL_END);
    xs.push(x);
    sizes.push(size);
    x += size;
  }
  const inside = clamp(p, 0, count - 1);
  const i0 = Math.floor(inside);
  const i1 = Math.min(count - 1, i0 + 1);
  const f = inside - i0;
  // Past either end the lens resists instead of following.
  const overshoot = (p - inside) * SLOT * 0.3;
  return { xs, sizes, total: x + PAD, lensX: lerp(xs[i0] ?? PAD, xs[i1] ?? PAD, f) + overshoot, lensW: lerp(sizes[i0] ?? SLOT, sizes[i1] ?? SLOT, f), open };
}

/** useTransform over the position, the measured label widths and an optional extra value (mixed types, one cast). */
function useGeometry<T>(position: MotionValue<number>, widths: MotionValue<number[]>, extra: MotionValue<number> | null, pick: (p: number, w: number[], e: number) => T) {
  // The function form tracks every motion value it reads.
  return useTransform(() => pick(position.get(), widths.get(), extra ? extra.get() : 0));
}

function Badge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span aria-hidden="true" className="absolute top-0.5 left-[calc(50%+3px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-white tabular-nums ring-2 ring-background">
      <RollingDigits value={count} />
    </span>
  );
}

function Slot({
  tab,
  index,
  position,
  widths,
  labels,
  selected,
  inverted,
}: {
  tab: LensTab;
  index: number;
  position: MotionValue<number>;
  widths: MotionValue<number[]>;
  labels: LensTabBarProps["labels"];
  selected: number;
  inverted: boolean;
}) {
  const x = useGeometry(position, widths, null, (p, w) => geometry(p, w, labels).xs[index] ?? 0);
  const width = useGeometry(position, widths, null, (p, w) => geometry(p, w, labels).sizes[index] ?? SLOT);
  // The label leaving fades out at once; the new one fades in only as the lens arrives.
  const labelOpacity = useTransform(position, (p) => {
    if (labels === "always") return 1;
    if (labels === "none" || index !== selected) return 0;
    return clamp((1 - Math.abs(p - index)) * 4 - 3, 0, 1);
  });
  return (
    <motion.span className="absolute top-0 flex h-full items-center overflow-hidden" style={{ x, width }}>
      <span className="relative grid size-11 shrink-0 place-items-center [&>svg]:size-5">
        {inverted ? (tab.activeIcon ?? tab.icon) : tab.icon}
        <Badge count={tab.badge} />
      </span>
      {labels === "none" ? null : (
        <motion.span className="pr-3 text-[13px] font-medium whitespace-nowrap" style={{ opacity: labelOpacity }}>
          {tab.label}
        </motion.span>
      )}
    </motion.span>
  );
}

/**
 * An iOS-style tab bar whose selection is a lens: whatever passes under it is redrawn inverted
 * (filled icons, contrasting labels). The row is rendered twice; the top, inverted copy is clipped
 * to the lens shape, and every part is a pure function of one continuous position.
 */
export function LensTabBar({ tabs, value, onValueChange, labels = "active", label = "Sections", id, className }: LensTabBarProps) {
  const autoId = useId();
  const baseId = id ?? `lens${autoId.replace(/:/g, "")}`;
  const count = tabs.length;
  const selected = Math.max(0, tabs.findIndex((tab) => tab.value === value));
  const position = useMotionValue(selected);
  const widths = useMotionValue(tabs.map((tab) => Math.round(tab.label.length * 7.4)));
  const leanTarget = useMotionValue(0);
  const lean = useSpring(leanTarget, { stiffness: 260, damping: 26 });
  const reduceMotion = useReducedMotion();
  const target = useRef(selected);
  const playback = useRef<AnimationPlaybackControls | null>(null);
  const measurers = useRef<(HTMLSpanElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef({ id: -1, active: false, startX: 0, startPosition: 0, startTime: 0, dragged: false });

  const total = useGeometry(position, widths, null, (p, w) => `${geometry(p, w, labels).total}px`);
  const lensX = useGeometry(position, widths, lean, (p, w, l) => geometry(p, w, labels).lensX + l);
  const lensW = useGeometry(position, widths, null, (p, w) => geometry(p, w, labels).lensW);
  const clip = useGeometry(position, widths, lean, (p, w, l) => {
    const g = geometry(p, w, labels);
    const left = g.lensX + l;
    return `inset(${PAD}px ${Math.max(0, g.total - left - g.lensW)}px ${PAD}px ${Math.max(0, left)}px round 999px)`;
  });

  // Measure each label from a hidden copy whenever the tabs change.
  useEffect(() => {
    const nodes = measurers.current.slice(0, count).filter((node): node is HTMLSpanElement => node !== null);
    const observer = new ResizeObserver(() => widths.set(measurers.current.slice(0, count).map((node) => node?.offsetWidth ?? 0)));
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [count, tabs, widths]);

  // Follow the selected value: the lens slides and resizes on a single spring.
  useEffect(() => {
    if (selected === target.current && !drag.current.active) return;
    target.current = selected;
    playback.current?.stop();
    if (reduceMotion) position.jump(selected);
    else playback.current = animate(position, selected, SPRING);
  }, [selected, position, reduceMotion]);

  const choose = (index: number, focus = false) => {
    const next = tabs[clamp(index, 0, count - 1)];
    if (!next) return;
    if (focus) tabRefs.current[clamp(index, 0, count - 1)]?.focus();
    if (next.value !== value) onValueChange(next.value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowRight: (selected + 1) % count, ArrowLeft: (selected - 1 + count) % count, Home: 0, End: count - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    choose(moves[event.key], true);
  };

  const pitch = () => {
    const w = widths.get();
    return w.length ? geometry(position.get(), w, labels).total / Math.max(1, count) : SLOT;
  };
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    if (index !== selected || (event.pointerType === "mouse" && event.button !== 0)) return;
    // event.timeStamp shares performance.now()'s time origin.
    drag.current = { id: event.pointerId, active: false, startX: event.clientX, startPosition: position.get(), startTime: event.timeStamp, dragged: false };
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
    position.set(state.startPosition + dx / pitch());
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (state.id !== event.pointerId) return;
    state.id = -1;
    if (!state.active) return;
    state.active = false;
    const p = position.get();
    const velocity = clamp(position.getVelocity(), -30, 30);
    let next = clamp(Math.round(p + velocity * 0.18), 0, count - 1);
    const from = Math.round(state.startPosition);
    // A quick flick always moves at least one tab.
    const quick = performance.now() - state.startTime < 300 && Math.abs(p - state.startPosition) > 0.1;
    if (next === from && (Math.abs(velocity) > 1 || quick)) next = clamp(from + Math.sign(Math.abs(velocity) > 1 ? velocity : p - state.startPosition), 0, count - 1);
    target.current = next;
    playback.current?.stop();
    playback.current = reduceMotion ? null : animate(position, next, { ...SPRING, velocity });
    if (reduceMotion) position.jump(next);
    if (tabs[next].value !== value) onValueChange(tabs[next].value);
  };

  return (
    <div className={cn("max-w-full overflow-x-auto [scrollbar-width:none]", className)}>
      <motion.div
        role="tablist"
        aria-label={label}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => leanTarget.set(0)}
        className="relative h-[52px] touch-pan-y rounded-full border border-border bg-background/90 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur select-none"
        style={{ width: total }}
      >
        {/* Bottom copy: the real, focusable tabs in their normal style. */}
        {tabs.map((tab, i) => (
          <Slot key={tab.value} tab={tab} index={i} position={position} widths={widths} labels={labels} selected={selected} inverted={false} />
        ))}
        {tabs.map((tab, i) => (
          <TabButton
            key={tab.value}
            tab={tab}
            index={i}
            baseId={baseId}
            selected={i === selected}
            position={position}
            widths={widths}
            labels={labels}
            buttonRef={(element) => {
              tabRefs.current[i] = element;
            }}
            onPointerDown={(event) => onPointerDown(event, i)}
            onHover={() => {
              if (!reduceMotion) leanTarget.set(clamp((i - selected) * 5, -6, 6));
            }}
            onSelect={() => {
              if (drag.current.dragged) {
                drag.current.dragged = false;
                return;
              }
              choose(i);
            }}
          />
        ))}
        {/* The lens: a dark pill under an inverted copy of the row, clipped to the pill. */}
        <motion.span aria-hidden="true" className="pointer-events-none absolute top-1 bottom-1 rounded-full shadow-[0_6px_16px_-6px_rgb(0_0_0/0.45)]" style={{ x: lensX, width: lensW }} />
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-foreground text-background" style={{ clipPath: clip }}>
          {tabs.map((tab, i) => (
            <Slot key={tab.value} tab={tab} index={i} position={position} widths={widths} labels={labels} selected={selected} inverted />
          ))}
        </motion.div>
      </motion.div>
      {/* Hidden copies that measure each label. */}
      <div aria-hidden="true" className="pointer-events-none invisible absolute h-0 overflow-hidden">
        {tabs.map((tab, i) => (
          <span
            key={tab.value}
            ref={(element) => {
              measurers.current[i] = element;
            }}
            className="inline-block text-[13px] font-medium whitespace-nowrap"
          >
            {tab.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A real tab: transparent, sitting exactly over its slot, carrying the name, state and focus. */
function TabButton({
  tab,
  index,
  baseId,
  selected,
  position,
  widths,
  labels,
  buttonRef,
  onPointerDown,
  onHover,
  onSelect,
}: {
  tab: LensTab;
  index: number;
  baseId: string;
  selected: boolean;
  position: MotionValue<number>;
  widths: MotionValue<number[]>;
  labels: LensTabBarProps["labels"];
  buttonRef: (element: HTMLButtonElement | null) => void;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onHover: () => void;
  onSelect: () => void;
}) {
  const x = useGeometry(position, widths, null, (p, w) => geometry(p, w, labels).xs[index] ?? 0);
  const width = useGeometry(position, widths, null, (p, w) => geometry(p, w, labels).sizes[index] ?? SLOT);
  return (
    <motion.button
      ref={buttonRef}
      type="button"
      role="tab"
      id={lensTabId(baseId, tab.value)}
      aria-selected={selected}
      aria-controls={lensPanelId(baseId, tab.value)}
      tabIndex={selected ? 0 : -1}
      onPointerDown={onPointerDown}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") onHover();
      }}
      onClick={onSelect}
      className="absolute top-0 h-full cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      style={{ x, width }}
    >
      <span className="sr-only">
        {tab.label}
        {tab.badge ? `, ${tab.badgeLabel ?? tab.badge}` : ""}
      </span>
    </motion.button>
  );
}
