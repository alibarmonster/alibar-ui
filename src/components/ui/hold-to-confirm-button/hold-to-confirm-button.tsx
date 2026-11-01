"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration as durations, ease, spring } from "@/lib/motion";

export interface HoldToConfirmButtonProps
  extends Omit<ComponentProps<"button">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Called once the hold completes. */
  onConfirm?: () => void;
  /** Milliseconds the button must be held. @default 1500 */
  duration?: number;
  /** Label shown after confirming. @default "Confirmed" */
  confirmedLabel?: ReactNode;
  /** Milliseconds before resetting after a confirm. 0 keeps it confirmed. @default 2000 */
  resetAfter?: number;
  /** Icon shown before the label. */
  icon?: ReactNode;
  /** Color of the fill. @default "destructive" */
  variant?: "destructive" | "primary" | "neutral";
  /** Button size. @default "md" */
  size?: "md" | "lg";
}

const fillClasses = {
  destructive: "bg-destructive text-white",
  primary: "bg-primary text-primary-foreground",
  neutral: "bg-foreground text-background",
} as const;

const sizeClasses = {
  md: "h-10 px-4 text-sm rounded-md",
  lg: "h-12 px-6 text-[15px] rounded-lg",
} as const;

const HOLD_KEYS = new Set([" ", "Enter"]);
type Status = "idle" | "holding" | "confirmed";

export function HoldToConfirmButton({
  onConfirm,
  duration = 1500,
  confirmedLabel = "Confirmed",
  resetAfter = 2000,
  icon,
  variant = "destructive",
  size = "md",
  type = "button",
  disabled,
  className,
  children,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  onBlur,
  "aria-describedby": describedBy,
  ...props
}: HoldToConfirmButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const progress = useMotionValue(0);
  const clipPath = useTransform(progress, (p) => `inset(0 ${(1 - p) * 100}% 0 0)`);
  const animation = useRef<AnimationPlaybackControls | null>(null);
  const resetTimer = useRef<number | undefined>(undefined);
  const onConfirmRef = useRef(onConfirm);
  const reduceMotion = useReducedMotion();
  const hintId = useId();

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  });

  useEffect(
    () => () => {
      animation.current?.stop();
      window.clearTimeout(resetTimer.current);
    },
    [],
  );

  function start() {
    if (disabled || status === "confirmed") return;
    setStatus("holding");
    animation.current?.stop();
    // Resume from wherever a cancelled hold left the fill.
    animation.current = animate(progress, 1, {
      duration: (duration / 1000) * (1 - progress.get()),
      ease: "linear",
      onComplete: () => {
        setStatus("confirmed");
        onConfirmRef.current?.();
        if (resetAfter > 0) {
          resetTimer.current = window.setTimeout(() => {
            setStatus("idle");
            animation.current = animate(progress, 0, { duration: durations.slow, ease: ease.out });
          }, resetAfter);
        }
      },
    });
  }

  function cancel() {
    if (status !== "holding") return;
    animation.current?.stop();
    setStatus("idle");
    animation.current = animate(progress, 0, { duration: durations.base, ease: ease.out });
  }

  const swap = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 8, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -8, filter: "blur(4px)" },
      };

  const idleContent = (
    <span className="inline-flex items-center gap-2">
      {icon}
      {children}
    </span>
  );

  return (
    <>
      <motion.button
        type={type}
        disabled={disabled}
        aria-describedby={[hintId, describedBy].filter(Boolean).join(" ")}
        animate={{ scale: status === "holding" && !reduceMotion ? 0.97 : 1 }}
        transition={spring.snappy}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.button === 0) start();
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          cancel();
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          cancel();
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          cancel();
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!HOLD_KEYS.has(event.key)) return;
          event.preventDefault();
          if (!event.repeat) start();
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);
          if (HOLD_KEYS.has(event.key)) cancel();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          cancel();
        }}
        onContextMenu={(event) => event.preventDefault()}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer touch-none items-center justify-center overflow-hidden border border-border bg-background font-medium whitespace-nowrap text-foreground shadow-xs outline-none select-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {/* Both labels share one cell so the width fits the longer one and never jumps. */}
        <span className="grid *:[grid-area:1/1]">
          {idleContent}
          <span className="invisible inline-flex items-center gap-2" aria-hidden="true">
            <Check />
            {confirmedLabel}
          </span>
        </span>

        {/* The fill is a copy of the label in the fill color, revealed with clip-path. */}
        <motion.span
          aria-hidden="true"
          style={{ clipPath }}
          className={cn("absolute inset-0 flex items-center justify-center", fillClasses[variant])}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={status === "confirmed" ? "confirmed" : "idle"}
              variants={swap}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: durations.quick, ease: ease.out }}
              className="inline-flex items-center gap-2"
            >
              {status === "confirmed" ? (
                <>
                  <Check strokeWidth={2.5} />
                  {confirmedLabel}
                </>
              ) : (
                <>
                  {icon}
                  {children}
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </motion.button>
      <span id={hintId} className="sr-only">
        Press and hold for {Math.round(duration / 100) / 10} seconds to confirm.
      </span>
      <span role="status" className="sr-only">
        {status === "confirmed" ? confirmedLabel : null}
      </span>
    </>
  );
}
