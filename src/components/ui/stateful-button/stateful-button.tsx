"use client";

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

export type StatefulButtonState = "idle" | "loading" | "success" | "error";

export interface StatefulButtonProps
  extends Omit<ComponentProps<"button">, "onClick" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Runs on click. Return a promise to move through loading, success and error automatically. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
  /** Controlled state. Leave undefined to let the button manage it. */
  state?: StatefulButtonState;
  /** Called whenever the button moves to a new state. */
  onStateChange?: (state: StatefulButtonState) => void;
  /** Label while loading. @default "Loading" */
  loadingLabel?: ReactNode;
  /** Label after success. @default "Done" */
  successLabel?: ReactNode;
  /** Label after an error. @default "Try again" */
  errorLabel?: ReactNode;
  /** Milliseconds to show success or error before returning to idle. 0 keeps the result. @default 1800 */
  resetAfter?: number;
  /** Visual style. @default "solid" */
  variant?: "solid" | "primary" | "outline";
  /** Button size. @default "md" */
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  solid:
    "bg-foreground text-background shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.14),0_4px_12px_-2px_rgb(0_0_0/0.12)]",
  primary:
    "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(0_0_0/0.12),0_4px_12px_-2px_color-mix(in_oklab,var(--primary)_40%,transparent)]",
  outline: "border border-border bg-background text-foreground shadow-xs",
} as const;

const sizeClasses = {
  sm: "h-8 gap-1.5 px-3 text-[13px] after:absolute after:-inset-1 after:content-['']",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-[15px]",
} as const;

// Inline radius so Motion can correct it while the width animates.
const radius = { sm: 10, md: 10, lg: 14 } as const;

function Spinner() {
  return (
    // A CSS animation (pulsing under reduced motion via the media query), so markup never depends on JS state.
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin motion-reduce:animate-pulse">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function DrawnIcon({ paths }: { paths: string[] }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {paths.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: duration.base, ease: ease.out, delay: 0.08 + i * 0.08 }}
        />
      ))}
    </svg>
  );
}

const CHECK = ["M5 12.5l4.5 4.5L19 7.5"];
const CROSS = ["M7 7l10 10", "M17 7L7 17"];

export function StatefulButton({
  onClick,
  state,
  onStateChange,
  loadingLabel = "Loading",
  successLabel = "Done",
  errorLabel = "Try again",
  resetAfter = 1800,
  variant = "solid",
  size = "md",
  type = "button",
  className,
  style,
  children,
  ...props
}: StatefulButtonProps) {
  const [internalState, setInternalState] = useState<StatefulButtonState>("idle");
  const current = state ?? internalState;
  const reduceMotion = useReducedMotion();
  const mounted = useRef(true);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const setState = (next: StatefulButtonState) => {
    if (!mounted.current) return;
    if (state === undefined) setInternalState(next);
    onStateChangeRef.current?.(next);
  };

  useEffect(() => {
    if ((current !== "success" && current !== "error") || resetAfter <= 0) return;
    const timer = window.setTimeout(() => {
      if (state === undefined) setInternalState("idle");
      onStateChangeRef.current?.("idle");
    }, resetAfter);
    return () => window.clearTimeout(timer);
  }, [current, resetAfter, state]);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (current !== "idle") return;
    const result = onClick?.(event);
    if (!result || typeof (result as Promise<unknown>).then !== "function") return;
    setState("loading");
    try {
      await result;
      setState("success");
    } catch {
      setState("error");
    }
  }

  const content: Variants = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 10, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -10, filter: "blur(4px)" },
      };

  const label =
    current === "loading" ? (
      <>
        <Spinner />
        {loadingLabel}
      </>
    ) : current === "success" ? (
      <>
        <DrawnIcon paths={CHECK} />
        {successLabel}
      </>
    ) : current === "error" ? (
      <>
        <DrawnIcon paths={CROSS} />
        {errorLabel}
      </>
    ) : (
      children
    );

  const busy = current !== "idle";

  return (
    <>
      <motion.button
        type={type}
        layout={!reduceMotion}
        aria-busy={current === "loading"}
        aria-disabled={busy || undefined}
        onClick={handleClick}
        animate={current === "error" && !reduceMotion ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ layout: spring.smooth, x: { duration: 0.4, ease: ease.out } }}
        style={{ borderRadius: radius[size], ...style }}
        className={cn(
          "relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden font-medium whitespace-nowrap outline-none select-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-default [&_svg]:size-4 [&_svg]:shrink-0",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {/* Result tints fade in over the base color instead of animating background-color. */}
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-[inherit] bg-success"
          initial={false}
          animate={{ opacity: current === "success" ? 1 : 0 }}
          transition={{ duration: duration.base }}
        />
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-[inherit] bg-destructive"
          initial={false}
          animate={{ opacity: current === "error" ? 1 : 0 }}
          transition={{ duration: duration.base }}
        />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={current}
            layout={!reduceMotion ? "position" : false}
            variants={content}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: duration.quick, ease: ease.out }}
            className={cn(
              "inline-flex items-center gap-[inherit]",
              (current === "success" || current === "error") && "text-white",
            )}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <span role="status" className="sr-only">
        {current === "loading" ? loadingLabel : current === "success" ? successLabel : current === "error" ? errorLabel : null}
      </span>
    </>
  );
}
