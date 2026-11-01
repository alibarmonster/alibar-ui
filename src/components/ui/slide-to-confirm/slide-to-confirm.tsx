"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { Check, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

export interface SlideToConfirmProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Called when the knob reaches the end, or when Enter or Space is pressed on it. */
  onConfirm?: () => void;
  /** Text in the track. @default "Slide to confirm" */
  label?: string;
  /** Text once confirmed. @default "Confirmed" */
  confirmedLabel?: string;
  /** Icon on the knob before confirming. @default <ChevronsRight /> */
  icon?: ReactNode;
  /** Fraction of the track the knob must pass before release confirms. @default 0.85 */
  threshold?: number;
  /** Milliseconds before resetting after a confirm. 0 keeps it locked. @default 0 */
  resetAfter?: number;
  /** Fill color while sliding and once confirmed. @default "success" */
  tone?: "success" | "primary" | "destructive";
  /** Disables dragging and keyboard confirmation. @default false */
  disabled?: boolean;
}

// Track padding and knob size in px (p-1 and size-12).
const PAD = 4;
const KNOB = 48;

const fillClasses = {
  success: "bg-success",
  primary: "bg-primary",
  destructive: "bg-destructive",
} as const;

const toneText = {
  success: "text-success",
  primary: "text-primary",
  destructive: "text-destructive",
} as const;

export function SlideToConfirm({
  onConfirm,
  label = "Slide to confirm",
  confirmedLabel = "Confirmed",
  icon,
  threshold = 0.85,
  resetAfter = 0,
  tone = "success",
  disabled = false,
  className,
  ...props
}: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const confirmedRef = useRef(false);
  const onConfirmRef = useRef(onConfirm);
  const [confirmed, setConfirmed] = useState(false);
  const [maxDistance, setMaxDistance] = useState(0);
  const reduceMotion = useReducedMotion();
  const inView = useInView(trackRef);
  const hintId = useId();

  const x = useMotionValue(0);
  const max = useMotionValue(0);
  const fillClip = useTransform([x, max], ([v, m]: number[]) => `inset(0 ${m - v}px 0 0 round 9999px)`);
  const fillOpacity = useTransform(x, [0, 24], [0, 1]);
  const labelOpacity = useTransform([x, max], ([v, m]: number[]) => 1 - Math.min(1, v / Math.max(m * 0.5, 1)));
  const labelX = useTransform(x, (v) => v * 0.2);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  });

  // Track the travel distance so the knob stays inside the track at any width.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const distance = Math.max(0, track.clientWidth - KNOB - PAD * 2);
      max.set(distance);
      setMaxDistance(distance);
      if (confirmedRef.current || x.get() > distance) x.set(distance);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [x, max]);

  useEffect(() => {
    if (!confirmed || resetAfter <= 0) return;
    const timer = window.setTimeout(() => {
      confirmedRef.current = false;
      setConfirmed(false);
      animate(x, 0, reduceMotion ? { duration: 0 } : spring.smooth);
    }, resetAfter);
    return () => window.clearTimeout(timer);
  }, [confirmed, resetAfter, reduceMotion, x]);

  function confirm() {
    if (confirmedRef.current || disabled) return;
    confirmedRef.current = true;
    setConfirmed(true);
    animate(x, max.get(), reduceMotion ? { duration: 0 } : spring.snappy);
    onConfirmRef.current?.();
  }

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative h-14 w-full max-w-xs rounded-full border border-border bg-muted p-1 shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] select-none",
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <motion.div
        aria-hidden="true"
        style={{ clipPath: fillClip, opacity: fillOpacity }}
        className={cn("absolute inset-0 rounded-full", fillClasses[tone])}
      />

      <motion.span
        aria-hidden="true"
        style={{ opacity: labelOpacity, x: labelX }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center pr-4 pl-14 text-sm font-medium text-foreground/65"
      >
        <span className="truncate">{label}</span>
      </motion.span>
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ opacity: confirmed ? 1 : 0 }}
        transition={{ duration: duration.base, delay: confirmed ? 0.1 : 0 }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center pr-14 pl-4 text-sm font-medium text-white"
      >
        <span className="truncate">{confirmedLabel}</span>
      </motion.span>

      <motion.button
        type="button"
        drag={confirmed || disabled ? false : "x"}
        dragConstraints={{ left: 0, right: maxDistance }}
        dragElastic={0.02}
        dragMomentum={false}
        onDragEnd={() => {
          if (x.get() >= max.get() * threshold) confirm();
          else animate(x, 0, reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32 });
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            confirm();
          }
        }}
        whileTap={confirmed || disabled || reduceMotion ? undefined : { scale: 0.96 }}
        style={{ x }}
        disabled={disabled}
        aria-label={confirmed ? confirmedLabel : label}
        aria-describedby={confirmed ? undefined : hintId}
        aria-disabled={confirmed || undefined}
        className={cn(
          "absolute top-1 left-1 z-10 flex size-12 touch-none items-center justify-center rounded-full bg-background text-foreground outline-none",
          "shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_1px_2px_rgb(0_0_0/0.1),0_4px_10px_-2px_rgb(0_0_0/0.16)]",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          confirmed ? "cursor-default" : "cursor-grab active:cursor-grabbing",
          "[&_svg]:size-5",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {confirmed ? (
            <motion.span
              key="check"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={reduceMotion ? { duration: duration.quick } : spring.bouncy}
              className={toneText[tone]}
            >
              <Check strokeWidth={2.75} aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span
              key="icon"
              initial={{ opacity: 0 }}
              animate={!reduceMotion && inView ? { opacity: 1, x: [0, 3, 0] } : { opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: duration.quick },
                x: { duration: 1, ease: ease.inOut, repeat: Infinity, repeatDelay: 1.6 },
              }}
              className="text-muted-foreground"
            >
              {icon ?? <ChevronsRight aria-hidden="true" />}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <span id={hintId} className="sr-only">
        Drag the handle to the end of the track, or press Enter.
      </span>
      <span role="status" className="sr-only">
        {confirmed ? confirmedLabel : null}
      </span>
    </div>
  );
}
