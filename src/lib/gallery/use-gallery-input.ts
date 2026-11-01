import { useEffect, useMemo, useRef, useState } from "react";
import { clamp, wrap } from "@/lib/gallery/math";

export interface DragMove {
  /** Pointer movement since the previous move event, CSS px. */
  dx: number;
  dy: number;
  /** Pointer and drag-start positions relative to the element. */
  x: number;
  y: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
}

export interface UseGalleryInputOptions {
  /** Number of items. */
  count: number;
  /** Wrap past the first and last item. @default false */
  loop?: boolean;
  /** Index shown first. @default 0 */
  startIndex?: number;
  /** Pointer drag with momentum. @default true */
  draggable?: boolean;
  /** One item per wheel notch. At the first or last item the page scrolls instead. @default true */
  wheel?: boolean;
  /** ← → (or ↑ ↓ on the y axis), Home, End, Enter, Escape and Space. @default true */
  keyboard?: boolean;
  /** Settle on the nearest item after a drag or throw. @default true */
  snap?: boolean;
  /** Seconds of glide a throw carries; 0 stops dead. @default 0.35 */
  inertia?: number;
  /** Drag and arrow-key axis. @default "x" */
  axis?: "x" | "y";
  /** Pixels of drag that move one item, or a function of the element's size. @default 200 */
  dragDistance?: number | ((width: number, height: number) => number);
  /** Custom drag mapping (e.g. turning a wheel around its center): returns the change in position, in items. */
  dragDelta?: (move: DragMove) => number;
  /** Step to the next item every `interval`. @default false */
  autoplay?: boolean;
  /** Autoplay interval in ms. @default 4000 */
  interval?: number;
  /** Pause autoplay while hovered. @default true */
  pauseOnHover?: boolean;
  /** Stops autoplay (input still works). @default false */
  paused?: boolean;
  /** Space toggles pause even without step autoplay, for galleries with continuous motion (drift, spin, streams). @default false */
  pausable?: boolean;
  /** Request a frame on every pointer move, e.g. for hover picking. @default false */
  trackPointer?: boolean;
  onIndexChange?: (index: number) => void;
  /** Enter on the gallery itself (not on a button inside it). */
  onSelect?: (index: number) => void;
  onEscape?: () => void;
  /** A press without a drag, in element coordinates. */
  onTap?: (point: { x: number; y: number }, input: Omit<GalleryInput, "index" | "autoplaying" | "userPaused">) => void;
  /** Called whenever the position changes so a renderer can draw. */
  invalidate?: () => void;
}

export interface GalleryInput {
  /** Pass as the gallery root's `ref`: the root receives pointer, wheel and key events. */
  bind: (element: HTMLElement | null) => void | (() => void);
  /** Active item (nearest to the current position). */
  index: number;
  /** Autoplay is on and not paused by the user or the `paused` prop. */
  autoplaying: boolean;
  /** The user paused motion (Space or `togglePause`). */
  userPaused: boolean;
  /** Current position in items (fractional while moving; unbounded when looping). */
  position: () => number;
  /** Active item right now (use in event handlers; `index` is the rendered value). */
  activeIndex: () => number;
  /** Velocity in items per second. */
  velocity: () => number;
  /** Advances the physics by dt seconds. Returns true while still moving. */
  update: (dt: number) => boolean;
  /** Moves the position by `delta` items with no spring (continuous drift). Ignored while a gesture or snap is in progress. */
  drift: (delta: number) => void;
  /** Drags from another control (e.g. a ruler): moves by `delta` items like a pointer drag. Finish with `scrubEnd()`. */
  scrub: (delta: number) => void;
  /** Ends a scrub: momentum, snapping and the quick-flick rule apply as for a drag. */
  scrubEnd: () => void;
  next: () => void;
  previous: () => void;
  goTo: (index: number, options?: { instant?: boolean }) => void;
  dragging: () => boolean;
  hovering: () => boolean;
  /** Last pointer position over the element. */
  pointer: () => { x: number; y: number; inside: boolean };
  /** True when autoplay or drift may run right now (not hovered, dragged, held, hidden or reduced). */
  canAutoplay: () => boolean;
  /** Holds autoplay for a reason, e.g. while an item is open. */
  hold: (reason: string, active: boolean) => void;
  togglePause: () => void;
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One input model for every gallery: a continuous position (in items) driven by pointer drag with
 * momentum and snapping, wheel notches, the keyboard and autoplay. Physics runs in `update(dt)`,
 * which the gallery's render loop calls each frame, so nothing re-renders React mid-gesture.
 */
export function useGalleryInput(options: UseGalleryInputOptions): GalleryInput {
  const latest = useRef(options);
  const startIndex = clamp(Math.round(options.startIndex ?? 0), 0, Math.max(0, options.count - 1));
  const [index, setIndex] = useState(startIndex);
  const [userPaused, setUserPaused] = useState(false);
  const restartAutoplay = useRef(() => {});
  const state = useRef({
    p: startIndex,
    raw: startIndex,
    v: 0,
    target: null as number | null,
    dragging: false,
    pending: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startP: 0,
    downT: 0,
    lastX: 0,
    lastY: 0,
    samples: [] as { t: number; p: number }[],
    hovering: false,
    inside: false,
    px: 0,
    py: 0,
    wheelAcc: 0,
    wheelAt: 0,
    lastIndex: startIndex,
    suppressClick: false,
    holds: new Set<string>(),
    userPaused: false,
  });

  useEffect(() => {
    latest.current = options;
  });

  const api = useMemo(() => {
    const st = () => state.current;
    const max = () => Math.max(0, latest.current.count - 1);
    const kick = () => latest.current.invalidate?.();

    const sync = () => {
      const s = st();
      const { count, loop } = latest.current;
      if (count <= 0) return;
      const i = loop ? wrap(Math.round(s.p), count) : clamp(Math.round(s.p), 0, count - 1);
      if (i === s.lastIndex) return;
      s.lastIndex = i;
      setIndex(i);
      latest.current.onIndexChange?.(i);
    };

    const moveTo = (position: number, instant = false) => {
      const s = st();
      s.dragging = false;
      s.target = position;
      if (instant || reducedMotion()) {
        s.p = s.raw = position;
        s.v = 0;
        s.target = null;
      }
      sync();
      kick();
      restartAutoplay.current();
    };

    const goTo = (target: number, opts?: { instant?: boolean }) => {
      const { count, loop } = latest.current;
      if (!count) return;
      const s = st();
      const base = Math.round(s.target ?? s.p);
      if (loop) {
        let delta = wrap(Math.round(target) - wrap(base, count), count);
        if (delta > count / 2) delta -= count;
        moveTo(base + delta, opts?.instant);
      } else {
        moveTo(clamp(Math.round(target), 0, max()), opts?.instant);
      }
    };

    const step = (direction: number, cycle = false) => {
      const s = st();
      const base = Math.round(s.target ?? s.p);
      if (latest.current.loop) return moveTo(base + direction);
      const next = base + direction;
      if (cycle && next > max()) return moveTo(0);
      moveTo(clamp(next, 0, max()));
    };

    const canAutoplay = () => {
      const o = latest.current;
      const s = st();
      return (
        o.count > 1 &&
        !o.paused &&
        !s.userPaused &&
        !reducedMotion() &&
        !((o.pauseOnHover ?? true) && s.hovering) &&
        !s.dragging &&
        s.holds.size === 0 &&
        document.visibilityState === "visible"
      );
    };

    const update = (dt: number) => {
      const s = st();
      if (s.dragging) return true;
      if (s.target !== null) {
        if (reducedMotion()) {
          s.p = s.raw = s.target;
          s.v = 0;
          s.target = null;
          sync();
          return false;
        }
        // Critically damped spring, sub-stepped for stability on slow frames.
        const omega = 11;
        let remaining = dt;
        while (remaining > 0) {
          const h = Math.min(remaining, 1 / 120);
          s.v += (-omega * omega * (s.p - s.target) - 2 * omega * s.v) * h;
          s.p += s.v * h;
          remaining -= h;
        }
        if (Math.abs(s.p - s.target) < 0.0008 && Math.abs(s.v) < 0.01) {
          s.p = s.target;
          s.v = 0;
          s.target = null;
        }
        s.raw = s.p;
        sync();
        return s.target !== null;
      }
      if (s.v !== 0) {
        s.v *= Math.exp(-dt / Math.max(0.05, latest.current.inertia ?? 0.35));
        s.p += s.v * dt;
        if (!latest.current.loop && (s.p < 0 || s.p > max())) s.target = clamp(s.p, 0, max());
        if (Math.abs(s.v) < 0.02) s.v = 0;
        s.raw = s.p;
        sync();
        return s.v !== 0 || s.target !== null;
      }
      return false;
    };

    const release = () => {
      const s = st();
      s.dragging = false;
      const now = performance.now();
      const samples = s.samples;
      const lastSample = samples[samples.length - 1];
      let v = 0;
      // Only a pointer still moving at release throws. Use the last 150ms, but always at least the
      // last two samples: slow devices and coalesced events can space moves 80ms or more apart.
      if (lastSample && now - lastSample.t < 100) {
        let first = samples.find((sample) => now - sample.t < 150) ?? lastSample;
        if (first === lastSample && samples.length >= 2) first = samples[samples.length - 2];
        if (first !== lastSample) v = (lastSample.p - first.p) / Math.max(0.016, (lastSample.t - first.t) / 1000);
      }
      v = clamp(v, -30, 30);
      const { snap = true, inertia = 0.35, loop } = latest.current;
      if (snap) {
        let target = Math.round(s.p + v * inertia);
        const from = Math.round(s.startP);
        // A quick flick always moves at least one item: either it was still moving fast at release,
        // or the whole press was short and travelled a noticeable distance.
        const travel = s.p - s.startP;
        const quick = now - s.downT < 320 && Math.abs(travel) > 0.06;
        if (target === from && (Math.abs(v) > 0.6 || quick)) target = from + Math.sign(Math.abs(v) > 0.6 ? v : travel);
        s.target = loop ? target : clamp(target, 0, max());
      } else if (!loop && (s.p < 0 || s.p > max())) {
        s.target = clamp(s.p, 0, max());
      }
      s.v = v;
      if (reducedMotion()) {
        s.p = s.raw = s.target ?? s.p;
        s.v = 0;
        s.target = null;
      }
      sync();
      kick();
      restartAutoplay.current();
    };

    const togglePause = () => {
      const s = st();
      s.userPaused = !s.userPaused;
      setUserPaused(s.userPaused);
      restartAutoplay.current();
    };

    const bind = (element: HTMLElement | null) => {
      if (!element) return;
      const s = st();
      const local = (event: { clientX: number; clientY: number }) => {
        const rect = element.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height };
      };
      const onDown = (event: PointerEvent) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if ((event.target as Element | null)?.closest?.("[data-gallery-control]")) return;
        const point = local(event);
        s.pending = true;
        s.pointerId = event.pointerId;
        s.startX = s.lastX = point.x;
        s.startY = s.lastY = point.y;
        s.downT = performance.now();
      };
      const onMove = (event: PointerEvent) => {
        const point = local(event);
        s.px = point.x;
        s.py = point.y;
        s.inside = true;
        if (latest.current.trackPointer) kick();
        if (!s.pending || event.pointerId !== s.pointerId) return;
        if (!s.dragging) {
          if (!(latest.current.draggable ?? true)) return;
          if (Math.hypot(point.x - s.startX, point.y - s.startY) < 6) return;
          // Capture only once the pointer really moves, so clicks on links and buttons still land.
          s.dragging = true;
          s.target = null;
          s.v = 0;
          s.startP = s.raw = s.p;
          // Measure from the press: a fast flick may arrive as a single coalesced move event, and its
          // full distance (and speed) must still count.
          s.samples = [{ t: s.downT, p: s.p }];
          s.lastX = s.startX;
          s.lastY = s.startY;
          try {
            element.setPointerCapture(event.pointerId);
          } catch {}
        }
        const move: DragMove = { dx: point.x - s.lastX, dy: point.y - s.lastY, x: point.x, y: point.y, startX: s.startX, startY: s.startY, width: point.width, height: point.height };
        const o = latest.current;
        let delta: number;
        if (o.dragDelta) delta = o.dragDelta(move);
        else {
          const distance = typeof o.dragDistance === "function" ? o.dragDistance(point.width, point.height) : (o.dragDistance ?? 200);
          delta = -((o.axis ?? "x") === "y" ? move.dy : move.dx) / Math.max(1, distance);
        }
        s.raw += delta;
        s.p = rubber(s.raw);
        s.lastX = point.x;
        s.lastY = point.y;
        s.samples.push({ t: performance.now(), p: s.p });
        if (s.samples.length > 12) s.samples.shift();
        sync();
        kick();
      };
      const onUp = (event: PointerEvent) => {
        if (event.pointerId !== s.pointerId) return;
        const wasDragging = s.dragging;
        s.pending = false;
        s.pointerId = -1;
        if (wasDragging) {
          s.suppressClick = true;
          window.setTimeout(() => {
            s.suppressClick = false;
          }, 0);
          try {
            element.releasePointerCapture(event.pointerId);
          } catch {}
          release();
        } else if (event.type === "pointerup") {
          latest.current.onTap?.(local(event), controls);
        }
      };
      const onClickCapture = (event: MouseEvent) => {
        if (!s.suppressClick) return;
        event.preventDefault();
        event.stopPropagation();
      };
      const onEnter = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        s.hovering = true;
        kick();
      };
      const onLeave = () => {
        s.hovering = false;
        s.inside = false;
        kick();
        restartAutoplay.current();
      };
      const onWheel = (event: WheelEvent) => {
        if (!(latest.current.wheel ?? true)) return;
        const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1;
        const dx = event.deltaX * scale;
        const dy = event.deltaY * scale;
        const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
        if (!delta) return;
        const direction = Math.sign(delta);
        const base = Math.round(s.target ?? s.p);
        // At either end, let the page scroll instead of trapping the wheel.
        if (!latest.current.loop && ((direction < 0 && base <= 0) || (direction > 0 && base >= max()))) {
          s.wheelAcc = 0;
          return;
        }
        event.preventDefault();
        s.wheelAcc += delta;
        const now = performance.now();
        const notch = event.deltaMode !== 0 || Math.abs(delta) >= 50;
        if ((notch || Math.abs(s.wheelAcc) >= 60) && now - s.wheelAt > 110) {
          s.wheelAt = now;
          s.wheelAcc = 0;
          step(direction);
        }
      };
      const onKeyDown = (event: KeyboardEvent) => {
        const o = latest.current;
        if (!(o.keyboard ?? true)) return;
        const target = event.target as HTMLElement;
        if (target.closest("input, textarea, select, [contenteditable='true']")) return;
        const vertical = (o.axis ?? "x") === "y";
        if (event.key === (vertical ? "ArrowDown" : "ArrowRight")) {
          event.preventDefault();
          step(1);
        } else if (event.key === (vertical ? "ArrowUp" : "ArrowLeft")) {
          event.preventDefault();
          step(-1);
        } else if (event.key === "Home") {
          event.preventDefault();
          goTo(0);
        } else if (event.key === "End") {
          event.preventDefault();
          goTo(max());
        } else if (event.key === "Enter") {
          // Buttons and links inside the gallery handle Enter themselves.
          if (target !== element && target.closest("button, a")) return;
          event.preventDefault();
          o.onSelect?.(s.lastIndex);
        } else if (event.key === "Escape") {
          o.onEscape?.();
        } else if (event.key === " " && (o.autoplay || o.pausable) && !target.closest("[data-gallery-control]")) {
          event.preventDefault();
          togglePause();
        }
      };
      const onKeyUp = (event: KeyboardEvent) => {
        const o = latest.current;
        if (event.key === " " && (o.autoplay || o.pausable) && (o.keyboard ?? true) && !(event.target as HTMLElement).closest("[data-gallery-control]")) event.preventDefault();
      };
      const onDragStart = (event: Event) => event.preventDefault();

      element.addEventListener("pointerdown", onDown);
      element.addEventListener("pointermove", onMove);
      element.addEventListener("pointerup", onUp);
      element.addEventListener("pointercancel", onUp);
      element.addEventListener("pointerenter", onEnter);
      element.addEventListener("pointerleave", onLeave);
      element.addEventListener("click", onClickCapture, true);
      element.addEventListener("wheel", onWheel, { passive: false });
      element.addEventListener("keydown", onKeyDown);
      element.addEventListener("keyup", onKeyUp);
      element.addEventListener("dragstart", onDragStart);
      return () => {
        element.removeEventListener("pointerdown", onDown);
        element.removeEventListener("pointermove", onMove);
        element.removeEventListener("pointerup", onUp);
        element.removeEventListener("pointercancel", onUp);
        element.removeEventListener("pointerenter", onEnter);
        element.removeEventListener("pointerleave", onLeave);
        element.removeEventListener("click", onClickCapture, true);
        element.removeEventListener("wheel", onWheel);
        element.removeEventListener("keydown", onKeyDown);
        element.removeEventListener("keyup", onKeyUp);
        element.removeEventListener("dragstart", onDragStart);
      };
    };

    const rubber = (value: number) => {
      if (latest.current.loop) return value;
      const limit = max();
      if (value < 0) return value * 0.35;
      if (value > limit) return limit + (value - limit) * 0.35;
      return value;
    };

    const scrub = (delta: number) => {
      const s = st();
      const now = performance.now();
      if (!s.dragging) {
        s.dragging = true;
        s.target = null;
        s.v = 0;
        s.startP = s.raw = s.p;
        s.downT = now;
        s.samples = [{ t: now, p: s.p }];
      }
      s.raw += delta;
      s.p = rubber(s.raw);
      s.samples.push({ t: now, p: s.p });
      if (s.samples.length > 12) s.samples.shift();
      sync();
      kick();
    };

    const scrubEnd = () => {
      if (st().dragging) release();
    };

    const drift = (delta: number) => {
      const s = st();
      if (s.dragging || s.pending || s.target !== null || s.v !== 0 || !delta) return;
      s.p = latest.current.loop ? s.p + delta : clamp(s.p + delta, 0, max());
      s.raw = s.p;
      sync();
    };

    const controls: Omit<GalleryInput, "index" | "autoplaying" | "userPaused"> = {
      bind,
      position: () => st().p,
      activeIndex: () => st().lastIndex,
      velocity: () => st().v,
      update,
      drift,
      scrub,
      scrubEnd,
      next: () => step(1),
      previous: () => step(-1),
      goTo,
      dragging: () => st().dragging,
      hovering: () => st().hovering,
      pointer: () => ({ x: st().px, y: st().py, inside: st().inside }),
      canAutoplay,
      hold: (reason: string, active: boolean) => {
        const s = st();
        if (active) s.holds.add(reason);
        else s.holds.delete(reason);
        restartAutoplay.current();
        kick();
      },
      togglePause,
    };
    // Autoplay cycles back to the start at the end of a non-looping gallery.
    return { controls, autoStep: () => step(1, true) };
  }, []);

  const { autoplay, interval } = options;
  useEffect(() => {
    if (!autoplay) return;
    const wait = Math.max(800, interval ?? 4000);
    let timer = 0;
    const tick = () => {
      timer = window.setTimeout(() => {
        if (api.controls.canAutoplay()) api.autoStep();
        tick();
      }, wait);
    };
    // Any manual move restarts the countdown so autoplay never jumps right after the user acts.
    restartAutoplay.current = () => {
      window.clearTimeout(timer);
      tick();
    };
    tick();
    return () => {
      window.clearTimeout(timer);
      restartAutoplay.current = () => {};
    };
  }, [autoplay, interval, api]);

  return { ...api.controls, index, userPaused, autoplaying: Boolean(autoplay) && !options.paused && !userPaused };
}
