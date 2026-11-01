"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion, type Variants } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface QuantityStepperProps
  extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Controlled value. */
  value?: number;
  /** Initial value when uncontrolled. @default min */
  defaultValue?: number;
  /** Called with the new value after every step. */
  onValueChange?: (value: number) => void;
  /** Lowest value. @default 0 */
  min?: number;
  /** Highest value. @default 99 */
  max?: number;
  /** Amount added or removed per step. @default 1 */
  step?: number;
  /** Control size. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Accessible name of the value, also used for the button labels. @default "Quantity" */
  label?: string;
  /** Disables the whole control. @default false */
  disabled?: boolean;
}

const sizes = {
  sm: { group: "gap-0.5 p-0.5", button: "size-7 [&_svg]:size-3.5", value: "min-w-7 text-[13px]" },
  md: { group: "gap-1 p-1", button: "size-8 [&_svg]:size-4", value: "min-w-9 text-sm" },
  lg: { group: "gap-1.5 p-1.5", button: "size-11 [&_svg]:size-5", value: "min-w-14 text-2xl" },
} as const;

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** Each digit place rolls on its own, up when increasing and down when decreasing. */
function RollingNumber({ value, direction }: { value: number; direction: number }) {
  const reduceMotion = useReducedMotion();
  const chars = String(value).split("");
  const roll: Variants = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: (dir: number) => ({ y: dir > 0 ? "70%" : "-70%", opacity: 0, filter: "blur(2px)" }),
        animate: { y: "0%", opacity: 1, filter: "blur(0px)" },
        exit: (dir: number) => ({ y: dir > 0 ? "-70%" : "70%", opacity: 0, filter: "blur(2px)" }),
      };
  const transition = { duration: duration.base, ease: ease.out };

  return (
    <span className="inline-flex justify-center overflow-hidden leading-[1.3] tabular-nums [mask-image:linear-gradient(transparent,black_22%,black_78%,transparent)]">
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        {chars.map((char, i) => {
          const place = chars.length - 1 - i;
          return (
            <motion.span
              key={`place-${place}`}
              custom={direction}
              variants={roll}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="relative inline-block"
            >
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.span
                  key={char}
                  custom={direction}
                  variants={roll}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          );
        })}
      </AnimatePresence>
    </span>
  );
}

export function QuantityStepper({
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 99,
  step = 1,
  size = "md",
  label = "Quantity",
  disabled = false,
  className,
  ...props
}: QuantityStepperProps) {
  const [internal, setInternal] = useState(() => clamp(defaultValue ?? min, min, max));
  const current = clamp(value ?? internal, min, max);
  const [direction, setDirection] = useState(1);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const latest = useRef(current);
  const repeat = useRef<number | undefined>(undefined);
  const s = sizes[size];

  useEffect(() => {
    latest.current = current;
  });
  useEffect(() => () => window.clearTimeout(repeat.current), []);

  /** Applies a delta; returns false (and nudges the number) when already at a bound. */
  function change(delta: number) {
    const from = latest.current;
    const next = clamp(Number((from + delta).toFixed(10)), min, max);
    if (next === from) {
      if (!reduceMotion && scope.current) {
        const dir = Math.sign(delta);
        animate(scope.current, { x: [0, 4 * dir, -2 * dir, 0] }, { duration: 0.3, ease: ease.out });
      }
      return false;
    }
    latest.current = next;
    setDirection(Math.sign(next - from));
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
    return true;
  }

  function stopRepeat() {
    window.clearTimeout(repeat.current);
  }

  // Press and hold to repeat, speeding up the longer it is held.
  function startRepeat(delta: number) {
    stopRepeat();
    if (!change(delta)) return;
    let delay = 420;
    const tick = () => {
      if (!change(delta)) return;
      delay = Math.max(45, delay * 0.78);
      repeat.current = window.setTimeout(tick, delay);
    };
    repeat.current = window.setTimeout(tick, delay);
  }

  function onSpinKey(event: KeyboardEvent<HTMLDivElement>) {
    const big = Math.max(step, Math.round((max - min) / 10 / step) * step);
    const actions: Record<string, () => unknown> = {
      ArrowUp: () => change(step),
      ArrowRight: () => change(step),
      ArrowDown: () => change(-step),
      ArrowLeft: () => change(-step),
      PageUp: () => change(big),
      PageDown: () => change(-big),
      Home: () => change(min - latest.current),
      End: () => change(max - latest.current),
    };
    const action = actions[event.key];
    if (!action || disabled) return;
    event.preventDefault();
    action();
  }

  const stepButton = (delta: number) => {
    const atBound = delta < 0 ? current <= min : current >= max;
    const Icon = delta < 0 ? Minus : Plus;
    return (
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label={`${delta < 0 ? "Decrease" : "Increase"} ${label.toLowerCase()}`}
        aria-disabled={atBound || undefined}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          startRepeat(delta);
        }}
        onClick={(event) => {
          // Clicks from assistive tech arrive without a pointerdown (detail is 0).
          if (event.detail === 0) change(delta);
        }}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        onPointerCancel={stopRepeat}
        onContextMenu={(event) => event.preventDefault()}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer touch-none items-center justify-center rounded-full text-foreground outline-none select-none",
          "transition-[background-color,color,transform,opacity] duration-150 after:absolute after:-inset-1 hover:bg-accent active:scale-90",
          "aria-disabled:cursor-default aria-disabled:text-muted-foreground aria-disabled:opacity-50 aria-disabled:hover:bg-transparent aria-disabled:active:scale-100",
          s.button,
        )}
      >
        <Icon strokeWidth={2.25} aria-hidden="true" />
      </button>
    );
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center rounded-full border border-input bg-background shadow-xs",
        disabled && "pointer-events-none opacity-50",
        s.group,
        className,
      )}
      {...props}
    >
      {stepButton(-step)}
      <div
        ref={scope}
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuenow={current}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-disabled={disabled || undefined}
        onKeyDown={onSpinKey}
        className={cn(
          "flex items-center justify-center rounded-md px-1 font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
          s.value,
        )}
      >
        <RollingNumber value={current} direction={direction} />
      </div>
      {stepButton(step)}
    </div>
  );
}
