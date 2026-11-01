"use client";

import { useId, useState, type ComponentProps } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, type Variants } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

export interface AnimatedPaginationProps
  extends Omit<ComponentProps<"nav">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Number of pages. */
  totalPages: number;
  /** Controlled current page (1-based). */
  page?: number;
  /** Initial page when uncontrolled. @default 1 */
  defaultPage?: number;
  /** Called with the new page. */
  onPageChange?: (page: number) => void;
  /** Pages shown on each side of the current one. @default 1 */
  siblingCount?: number;
}

type Slot = number | "gap";

/** A fixed number of slots, so a shifting window rolls numbers in place instead of reflowing. */
function slotsFor(page: number, total: number, siblings: number): Slot[] {
  const size = siblings * 2 + 5; // first, gap, siblings…, current, …siblings, gap, last
  if (total <= size) return Array.from({ length: total }, (_, i) => i + 1);
  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, total);
  const showLeftGap = left > 3;
  const showRightGap = right < total - 2;
  if (!showLeftGap) return [...Array.from({ length: size - 2 }, (_, i) => i + 1), "gap", total];
  if (!showRightGap) return [1, "gap", ...Array.from({ length: size - 2 }, (_, i) => total - (size - 3) + i)];
  return [1, "gap", ...Array.from({ length: right - left + 1 }, (_, i) => left + i), "gap", total];
}

export function AnimatedPagination({
  totalPages,
  page,
  defaultPage = 1,
  onPageChange,
  siblingCount = 1,
  className,
  "aria-label": ariaLabel = "Pagination",
  ...props
}: AnimatedPaginationProps) {
  const [internal, setInternal] = useState(defaultPage);
  const current = Math.min(Math.max(page ?? internal, 1), Math.max(totalPages, 1));
  const reduceMotion = useReducedMotion();
  const groupId = useId();

  // Numbers roll up when moving forward and down when moving back.
  const [previous, setPrevious] = useState(current);
  const [direction, setDirection] = useState(1);
  if (previous !== current) {
    setDirection(current > previous ? 1 : -1);
    setPrevious(current);
  }

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 1), totalPages);
    if (clamped === current) return;
    if (page === undefined) setInternal(clamped);
    onPageChange?.(clamped);
  };

  const slots = slotsFor(current, totalPages, siblingCount);
  const roll: Variants = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: (dir: number) => ({ y: dir > 0 ? "70%" : "-70%", opacity: 0, filter: "blur(2px)" }),
        animate: { y: "0%", opacity: 1, filter: "blur(0px)" },
        exit: (dir: number) => ({ y: dir > 0 ? "-70%" : "70%", opacity: 0, filter: "blur(2px)" }),
      };

  const arrow =
    "inline-flex h-9 w-[1.875rem] cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 sm:w-9 [&_svg]:size-4";

  return (
    <nav aria-label={ariaLabel} className={className} {...props}>
      <LayoutGroup id={groupId}>
        {/* Slightly narrower slots below sm keep a 7-slot window inside a 320px screen. */}
        <ul className="flex items-center gap-0.5 sm:gap-1">
          <li>
            <button type="button" className={arrow} onClick={() => go(current - 1)} disabled={current <= 1} aria-label="Previous page">
              <ChevronLeft aria-hidden="true" />
            </button>
          </li>
          {slots.map((slot, index) => {
            if (slot === "gap") {
              return (
                <li key={`slot-${index}`} aria-hidden="true" className="flex h-9 w-[1.875rem] items-center justify-center text-sm text-muted-foreground sm:w-9">
                  …
                </li>
              );
            }
            const active = slot === current;
            return (
              <li key={`slot-${index}`}>
                <button
                  type="button"
                  onClick={() => go(slot)}
                  aria-label={`Page ${slot}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-9 min-w-[1.875rem] cursor-pointer items-center justify-center rounded-md px-1.5 text-sm font-medium tabular-nums outline-none sm:min-w-9 sm:px-2",
                    "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="active-page"
                      aria-hidden="true"
                      transition={reduceMotion ? { duration: 0 } : spring.snappy}
                      className="absolute inset-0 rounded-md bg-foreground shadow-sm"
                    />
                  ) : null}
                  <span aria-hidden="true" className="relative inline-flex h-5 items-center overflow-hidden">
                    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                      <motion.span
                        key={slot}
                        custom={direction}
                        variants={roll}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: duration.base, ease: ease.out }}
                        className="inline-block"
                      >
                        {slot}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </button>
              </li>
            );
          })}
          <li>
            <button type="button" className={arrow} onClick={() => go(current + 1)} disabled={current >= totalPages} aria-label="Next page">
              <ChevronRight aria-hidden="true" />
            </button>
          </li>
        </ul>
      </LayoutGroup>
    </nav>
  );
}
