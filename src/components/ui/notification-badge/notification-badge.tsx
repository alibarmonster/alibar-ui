"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface NotificationBadgeProps
  extends Omit<ComponentProps<"span">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** The element the badge sits on, e.g. an icon button. */
  children: ReactNode;
  /** Number to show. The badge hides at 0 unless showZero is set. @default 0 */
  count?: number;
  /** Counts above this show as "99+". @default 99 */
  max?: number;
  /** Show a dot instead of a number. @default false */
  dot?: boolean;
  /** Keep the badge visible at 0. @default false */
  showZero?: boolean;
  /** Add a soft, repeating ring to draw attention. @default false */
  pulse?: boolean;
  /** Badge color. @default "destructive" */
  tone?: "destructive" | "primary" | "success";
  /** Screen-reader announcement when the count changes. @default (n) => `${n} notifications` */
  label?: (count: number) => string;
}

const tones = {
  destructive: "bg-destructive text-white",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-white",
} as const;

const ringTones = { destructive: "bg-destructive", primary: "bg-primary", success: "bg-success" } as const;

export function NotificationBadge({
  children,
  count = 0,
  max = 99,
  dot = false,
  showZero = false,
  pulse = false,
  tone = "destructive",
  label = (n) => `${n} notification${n === 1 ? "" : "s"}`,
  className,
  ...props
}: NotificationBadgeProps) {
  const reduceMotion = useReducedMotion();
  const visible = dot || count > 0 || showZero;
  const text = count > max ? `${max}+` : String(count);

  // Digits roll up when the count rises and down when it falls.
  const [previous, setPrevious] = useState(count);
  const [direction, setDirection] = useState(1);
  if (previous !== count) {
    setDirection(count > previous ? 1 : -1);
    setPrevious(count);
  }

  const roll: Variants = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: (dir: number) => ({ y: dir > 0 ? "90%" : "-90%", opacity: 0 }),
        animate: { y: "0%", opacity: 1 },
        exit: (dir: number) => ({ y: dir > 0 ? "-90%" : "90%", opacity: 0 }),
      };

  return (
    <span className={cn("relative inline-flex", className)} {...props}>
      {children}
      <AnimatePresence>
        {visible ? (
          <motion.span
            key="badge"
            aria-hidden="true"
            layout={!reduceMotion}
            // Slides in diagonally from the corner and pops with a spring.
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.3, x: 6, y: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.3, x: 6, y: -6, transition: { duration: duration.quick, ease: ease.out } }
            }
            transition={reduceMotion ? { duration: duration.quick } : { type: "spring", stiffness: 500, damping: 18 }}
            style={{ borderRadius: 999 }}
            className={cn(
              "pointer-events-none absolute flex items-center justify-center ring-2 ring-background",
              dot ? "-top-0.5 -right-0.5 size-2.5" : "-top-1.5 -right-1.5 h-5 min-w-5 px-1.5 text-[11px] leading-none font-semibold tabular-nums",
              tones[tone],
            )}
          >
            {pulse ? (
              <motion.span
                className={cn("absolute inset-0 rounded-full", ringTones[tone])}
                initial={{ opacity: 0.55, scale: 1 }}
                animate={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 2.4 }}
                transition={{ duration: 1.4, ease: ease.out, repeat: reduceMotion ? 0 : Infinity, repeatDelay: 0.4 }}
              />
            ) : null}
            {dot ? null : (
              <span className="relative inline-flex h-full items-center overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                  <motion.span
                    key={text}
                    custom={direction}
                    variants={roll}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: duration.quick + 0.04, ease: ease.out }}
                    layout={reduceMotion ? false : "position"}
                    className="inline-block"
                  >
                    {text}
                  </motion.span>
                </AnimatePresence>
              </span>
            )}
          </motion.span>
        ) : null}
      </AnimatePresence>
      <span role="status" className="sr-only">
        {visible && !dot ? label(count) : ""}
      </span>
    </span>
  );
}
