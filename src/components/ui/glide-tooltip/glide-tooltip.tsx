"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

type Side = "top" | "bottom";

interface Target {
  id: string;
  element: HTMLElement;
  content: ReactNode;
  side: Side;
}

interface TooltipGroup {
  activeId: string | null;
  tooltipId: string;
  show: (target: Target, immediate?: boolean) => void;
  hide: (id: string) => void;
}

const GroupContext = createContext<TooltipGroup | null>(null);

export interface GlideTooltipProviderProps {
  /** Tooltips that share one floating surface, which glides between them. */
  children: ReactNode;
  /** Milliseconds of hover before the first tooltip appears. @default 500 */
  delay?: number;
  /** After a tooltip closes, others open instantly within this many milliseconds. @default 400 */
  skipDelay?: number;
}

const GAP = 8;
const EDGE = 8;
// Brief grace before closing, so moving between adjacent triggers glides instead of blinking.
const GRACE = 70;
const GLIDE = { stiffness: 520, damping: 40, mass: 0.6 };

export function GlideTooltipProvider({ children, delay = 500, skipDelay = 400 }: GlideTooltipProviderProps) {
  const [target, setTarget] = useState<Target | null>(null);
  const visible = useRef<Target | null>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const warmUntil = useRef(0);
  const wasHidden = useRef(true);
  const floatRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const tooltipId = useId();
  const x = useSpring(0, GLIDE);
  const y = useSpring(0, GLIDE);
  const arrowX = useMotionValue(0);

  const commit = useCallback((next: Target | null) => {
    visible.current = next;
    setTarget(next);
  }, []);

  const show = useCallback(
    (next: Target, immediate = false) => {
      window.clearTimeout(openTimer.current);
      window.clearTimeout(closeTimer.current);
      if (visible.current || immediate || performance.now() < warmUntil.current) commit(next);
      else openTimer.current = window.setTimeout(() => commit(next), delay);
    },
    [commit, delay],
  );

  const hide = useCallback(
    (id: string) => {
      window.clearTimeout(openTimer.current);
      if (visible.current?.id !== id) return;
      window.clearTimeout(closeTimer.current);
      closeTimer.current = window.setTimeout(() => {
        commit(null);
        warmUntil.current = performance.now() + skipDelay;
      }, GRACE);
    },
    [commit, skipDelay],
  );

  // Place the surface above (or below, if there is no room) and keep it inside the viewport.
  const place = useCallback(() => {
    const current = visible.current;
    const surface = floatRef.current;
    if (!current || !surface) return;
    const rect = current.element.getBoundingClientRect();
    const width = surface.offsetWidth;
    const height = surface.offsetHeight;
    let side = current.side;
    if (side === "top" && rect.top - height - GAP < EDGE) side = "bottom";
    else if (side === "bottom" && rect.bottom + height + GAP > window.innerHeight - EDGE) side = "top";
    const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, EDGE), window.innerWidth - width - EDGE);
    const top = side === "top" ? rect.top - height - GAP : rect.bottom + GAP;
    surface.dataset.side = side;
    arrowX.set(Math.min(Math.max(rect.left + rect.width / 2 - left, 10), width - 10));
    if (wasHidden.current || reduceMotion) {
      x.jump(left);
      y.jump(top);
    } else {
      x.set(left);
      y.set(top);
    }
    wasHidden.current = false;
  }, [arrowX, reduceMotion, x, y]);

  useLayoutEffect(() => {
    if (target) place();
    else wasHidden.current = true;
  }, [target, place]);

  useEffect(() => {
    if (!target) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") commit(null);
    };
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      window.removeEventListener("keydown", onKey);
    };
  }, [target, place, commit]);

  useEffect(
    () => () => {
      window.clearTimeout(openTimer.current);
      window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const group = useMemo(() => ({ activeId: target?.id ?? null, tooltipId, show, hide }), [target, tooltipId, show, hide]);

  return (
    <GroupContext.Provider value={group}>
      {children}
      {target
        ? createPortal(
            <motion.div
              ref={floatRef}
              id={tooltipId}
              role="tooltip"
              style={{ x, y }}
              className="group/tip pointer-events-none fixed top-0 left-0 z-[60]"
            >
              <AnimatePresence>
                <motion.div
                  key="surface"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: duration.instant } }}
                  transition={{ duration: duration.quick, ease: ease.out }}
                  className="relative w-max max-w-64 origin-bottom rounded-md bg-foreground px-2.5 py-1.5 text-xs leading-5 font-medium text-background shadow-lg group-data-[side=bottom]/tip:origin-top"
                >
                  <motion.span
                    key={target.id}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: duration.instant }}
                    className="flex items-center gap-1.5"
                  >
                    {target.content}
                  </motion.span>
                  {/* Position and rotation live on separate elements: CSS applies `rotate`
                      before `transform`, which would send the x offset along a 45° axis. */}
                  <motion.span
                    aria-hidden="true"
                    style={{ x: arrowX }}
                    className="absolute top-full left-0 -ml-1 size-2 -translate-y-1 group-data-[side=bottom]/tip:top-auto group-data-[side=bottom]/tip:bottom-full group-data-[side=bottom]/tip:translate-y-1"
                  >
                    <span className="block size-2 rotate-45 bg-foreground" />
                  </motion.span>
                </motion.div>
              </AnimatePresence>
            </motion.div>,
            document.body,
          )
        : null}
    </GroupContext.Provider>
  );
}

export interface GlideTooltipProps {
  /** Tooltip text or content. Keep it short; it isn't interactive. */
  content: ReactNode;
  /** Preferred side; flips automatically when there isn't room. @default "top" */
  side?: Side;
  /** Stops the tooltip from showing. @default false */
  disabled?: boolean;
  /** The trigger: a single focusable element, e.g. a button. */
  children: ReactElement;
}

function TooltipTrigger({ content, side = "top", disabled = false, children }: GlideTooltipProps) {
  const group = useContext(GroupContext)!;
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  const active = group.activeId === id;
  const target = () => (ref.current ? { id, element: ref.current, content, side } : null);

  return (
    <Slot.Root
      ref={ref}
      aria-describedby={active ? group.tooltipId : undefined}
      onPointerEnter={(event: PointerEvent<HTMLElement>) => {
        const t = target();
        if (!disabled && t && event.pointerType === "mouse") group.show(t);
      }}
      onPointerLeave={() => group.hide(id)}
      onPointerDown={() => group.hide(id)}
      onFocus={(event: FocusEvent<HTMLElement>) => {
        const t = target();
        // Keyboard focus shows the tooltip right away; mouse clicks don't.
        if (!disabled && t && event.currentTarget.matches(":focus-visible")) group.show(t, true);
      }}
      onBlur={() => group.hide(id)}
    >
      {children}
    </Slot.Root>
  );
}

export function GlideTooltip(props: GlideTooltipProps) {
  const group = useContext(GroupContext);
  // Works on its own too: a lone tooltip gets a private group.
  if (!group) {
    return (
      <GlideTooltipProvider>
        <TooltipTrigger {...props} />
      </GlideTooltipProvider>
    );
  }
  return <TooltipTrigger {...props} />;
}

/** Utility for shortcut hints inside tooltip content. */
export function TooltipKbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cn("font-sans text-[11px] tracking-wider text-background/60", className)}>{children}</kbd>;
}
