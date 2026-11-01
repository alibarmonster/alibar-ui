"use client";

import { useEffect, useState, type ComponentProps, type KeyboardEvent, type MouseEvent } from "react";
import { stagger, useAnimate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export interface StarRatingProps
  extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "role" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Controlled rating. */
  value?: number;
  /** Initial rating when uncontrolled. @default 0 */
  defaultValue?: number;
  /** Called with the new rating; 0 when cleared. */
  onValueChange?: (value: number) => void;
  /** Number of stars. @default 5 */
  max?: number;
  /** Allow half-star ratings from the pointer and keyboard. @default false */
  allowHalf?: boolean;
  /** Display only; fractional values like 4.6 fill partially. @default false */
  readOnly?: boolean;
  /** Clicking the current rating again clears it. @default true */
  clearable?: boolean;
  /** Star size. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Accessible name. @default "Rating" */
  label?: string;
}

const sizes = { sm: "size-4", md: "size-6", lg: "size-8" } as const;
const gaps = { sm: "gap-0.5", md: "gap-1", lg: "gap-1.5" } as const;
const STAR =
  "M11.48 3.5a.56.56 0 0 1 1.04 0l2.13 5.11a.56.56 0 0 0 .48.34l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 0 0-.19.56l1.29 5.38a.56.56 0 0 1-.84.61l-4.73-2.89a.56.56 0 0 0-.59 0l-4.72 2.89a.56.56 0 0 1-.84-.61l1.28-5.38a.56.56 0 0 0-.18-.56l-4.2-3.6a.56.56 0 0 1 .32-.99l5.52-.44a.56.56 0 0 0 .47-.34z";

function StarShape({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d={STAR} fill="currentColor" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

export function StarRating({
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  allowHalf = false,
  readOnly = false,
  clearable = true,
  size = "md",
  label = "Rating",
  className,
  ...props
}: StarRatingProps) {
  const [internal, setInternal] = useState(defaultValue);
  const rating = value ?? internal;
  const [hover, setHover] = useState<number | null>(null);
  const [pops, setPops] = useState(0);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const step = allowHalf ? 0.5 : 1;
  const shown = readOnly ? rating : (hover ?? rating);

  // After a new rating is committed, the filled stars pop one after another.
  useEffect(() => {
    if (pops === 0 || reduceMotion || !scope.current) return;
    const filled = scope.current.querySelectorAll("[data-filled=true]");
    if (filled.length) animate(filled, { scale: [1, 1.32, 0.94, 1] }, { duration: 0.42, ease: ease.out, delay: stagger(0.045) });
  }, [pops, reduceMotion, animate, scope]);

  function commit(next: number) {
    const clamped = Math.min(Math.max(next, 0), max);
    const final = clearable && clamped === rating ? 0 : clamped;
    if (value === undefined) setInternal(final);
    onValueChange?.(final);
    if (final > 0) setPops((n) => n + 1);
  }

  function pointerValue(index: number, event: MouseEvent<HTMLSpanElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return index + (allowHalf && event.clientX - rect.left < rect.width / 2 ? 0.5 : 1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const targets: Record<string, number> = {
      ArrowRight: rating + step,
      ArrowUp: rating + step,
      ArrowLeft: rating - step,
      ArrowDown: rating - step,
      Home: 0,
      End: max,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    const next = Math.min(Math.max(targets[event.key], 0), max);
    if (next === rating) return;
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
    if (next > rating) setPops((n) => n + 1);
  }

  const valueText = `${rating} out of ${max} stars`;

  return (
    <div
      ref={scope}
      role={readOnly ? "img" : "slider"}
      aria-label={readOnly ? `${label}: ${valueText}` : label}
      aria-valuemin={readOnly ? undefined : 0}
      aria-valuemax={readOnly ? undefined : max}
      aria-valuenow={readOnly ? undefined : rating}
      aria-valuetext={readOnly ? undefined : valueText}
      tabIndex={readOnly ? undefined : 0}
      onKeyDown={readOnly ? undefined : onKeyDown}
      onPointerLeave={() => setHover(null)}
      className={cn(
        // The fill color lives here so a text color class on the component recolors the stars.
        "inline-flex items-center rounded-md text-warning outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        gaps[size],
        className,
      )}
      {...props}
    >
      {Array.from({ length: max }, (_, index) => {
        const fill = Math.min(Math.max(shown - index, 0), 1);
        return (
          <span
            key={index}
            data-filled={fill > 0}
            onPointerMove={readOnly ? undefined : (event) => setHover(pointerValue(index, event))}
            onClick={readOnly ? undefined : (event) => commit(pointerValue(index, event))}
            className={cn("relative block", sizes[size], !readOnly && "cursor-pointer")}
          >
            <StarShape className={cn("absolute inset-0 text-[color-mix(in_oklab,var(--foreground)_13%,var(--background))]", sizes[size])} />
            {/* The filled star is clipped to the fill fraction, so halves and 4.6-style values just work. */}
            <span
              className={cn(
                "absolute inset-0 transition-[clip-path] duration-150 ease-out motion-reduce:transition-none",
                hover !== null && !readOnly && "opacity-90",
              )}
              style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}
            >
              <StarShape className={sizes[size]} />
            </span>
          </span>
        );
      })}
    </div>
  );
}
