"use client";

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface LogoItem {
  /** Stable identity. */
  id: string;
  /** Company name, read by screen readers. */
  name: string;
  /** The logo artwork. */
  logo: ReactNode;
}

export interface LogoCarouselProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** All logos; they rotate through the slots. */
  logos: LogoItem[];
  /** Logos visible at once. @default 4 */
  slots?: number;
  /** Milliseconds between swaps. @default 2800 */
  interval?: number;
  /** Seconds between neighboring slots swapping. @default 0.12 */
  stagger?: number;
  /** Stop rotating. Rotation also pauses while hovered, focused or offscreen. @default false */
  paused?: boolean;
  /** Heading read before the logo names. @default "Trusted by" */
  label?: string;
}

export function LogoCarousel({
  logos,
  slots = 4,
  interval = 2800,
  stagger = 0.12,
  paused = false,
  label = "Trusted by",
  className,
  style,
  ...props
}: LogoCarouselProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [start, setStart] = useState(0);
  const [held, setHeld] = useState(false);
  const count = Math.min(slots, logos.length);

  useEffect(() => {
    if (paused || held || !inView || logos.length <= count) return;
    const timer = window.setTimeout(() => setStart((s) => (s + count) % logos.length), interval);
    return () => window.clearTimeout(timer);
  }, [start, paused, held, inView, logos.length, count, interval]);

  const swap = {
    enter: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(8px)" },
    center: (i: number) => ({ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: duration.slow, ease: ease.out, delay: i * stagger + 0.08 } }),
    exit: (i: number) => ({
      opacity: 0,
      ...(reduceMotion ? {} : { y: -14, filter: "blur(8px)" }),
      transition: { duration: duration.base, ease: ease.out, delay: i * stagger },
    }),
  };

  return (
    <div
      ref={ref}
      // Columns come from --slots, so a class like max-sm:grid-cols-2 can still rearrange them.
      className={cn("grid grid-cols-[repeat(var(--slots),minmax(0,1fr))] items-center gap-x-6 gap-y-8", className)}
      style={{ ...style, "--slots": count } as CSSProperties}
      onPointerEnter={(event) => event.pointerType === "mouse" && setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      {...props}
    >
      <p className="sr-only">
        {label}: {logos.map((l) => l.name).join(", ")}
      </p>
      {Array.from({ length: count }, (_, slot) => {
        const logo = logos[(start + slot) % logos.length];
        return (
          // Each slot stacks its outgoing and incoming logo in one grid cell.
          <div key={slot} aria-hidden="true" className="grid h-12 place-items-center *:[grid-area:1/1]">
            <AnimatePresence initial={false} custom={slot}>
              <motion.div
                key={logo.id}
                custom={slot}
                variants={swap}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex items-center justify-center text-muted-foreground"
              >
                {logo.logo}
              </motion.div>
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
