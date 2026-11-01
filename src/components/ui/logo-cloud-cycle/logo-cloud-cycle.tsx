"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface CycleLogo {
  name: string;
  logo: ReactNode;
}

export interface LogoCloudCycleProps extends Omit<ComponentProps<"section">, "children"> {
  /** Pool of logos; keep it larger than `slots` so there's something to swap in. */
  items: CycleLogo[];
  /** Logos visible at once. @default 6 */
  slots?: number;
  /** Milliseconds between swaps (one slot at a time). @default 2000 */
  interval?: number;
  /** Columns on wider containers (2 below 34rem). @default 3 */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Pause swapping while hovered or focused. @default true */
  pauseOnHover?: boolean;
  /** Small line above the cloud. */
  eyebrow?: string;
}

const COLUMNS = { 2: "@[34rem]:grid-cols-2", 3: "@[34rem]:grid-cols-3", 4: "@[34rem]:grid-cols-4", 5: "@[34rem]:grid-cols-5", 6: "@[34rem]:grid-cols-6" } as const;
// Slots swap in a scattered order rather than left to right.
const ORDER = [0, 4, 2, 5, 1, 3, 7, 6, 9, 8, 11, 10];

export function LogoCloudCycle({ items, slots = 6, interval = 2000, columns = 3, pauseOnHover = true, eyebrow, className, ...props }: LogoCloudCycleProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const count = Math.min(slots, items.length);
  const [visible, setVisible] = useState(() => Array.from({ length: count }, (_, i) => i));
  const cursor = useRef(count);
  const step = useRef(0);
  const [paused, setPaused] = useState(false);
  const shown = useRef(visible);
  useEffect(() => {
    shown.current = visible;
  });

  useEffect(() => {
    if (paused || items.length <= count) return;
    const timer = window.setInterval(() => {
      const current = shown.current;
      const order = ORDER.filter((i) => i < count);
      const slot = order[step.current % order.length];
      step.current += 1;
      // Next logo from the pool that isn't already showing.
      let next = cursor.current % items.length;
      for (let guard = 0; current.includes(next) && guard < items.length; guard++) next = (next + 1) % items.length;
      cursor.current = next + 1;
      const updated = [...current];
      updated[slot] = next;
      setVisible(updated);
    }, interval);
    return () => window.clearInterval(timer);
  }, [paused, interval, items.length, count]);

  const pause = (value: boolean) => {
    if (pauseOnHover) setPaused(value);
  };

  return (
    <section
      onPointerEnter={() => pause(true)}
      onPointerLeave={() => pause(false)}
      onFocus={() => pause(true)}
      onBlur={() => pause(false)}
      className={cn("@container w-full py-10", className)}
      {...props}
    >
      {eyebrow ? <p className="mb-6 px-4 text-center text-sm text-muted-foreground">{eyebrow}</p> : null}
      <ul className={cn("grid grid-cols-2 gap-y-2", COLUMNS[columns])}>
        {visible.map((itemIndex, slot) => {
          const item = items[itemIndex];
          return (
            <li key={slot} className="relative grid h-20 place-items-center text-[21px] text-foreground/80 *:[grid-area:1/1]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={item.name}
                  role="img"
                  aria-label={item.name}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(8px)" }}
                  transition={{ duration: reduceMotion ? 0.3 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span aria-hidden="true">{item.logo}</span>
                </motion.span>
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
