"use client";

import { useState, type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction, NavItem } from "@/lib/nav/types";
import { useScrollState } from "@/lib/nav/use-scroll-state";

export interface TickerHeaderProps {
  /** Logo and name. */
  brand: ReactNode;
  /** Top-level links. */
  items: NavItem[];
  /** Actions on the right; the last one is filled. */
  actions?: NavAction[];
  /** Messages that scroll across the strip above the nav. */
  announcements: ReactNode[];
  /** Seconds for one full loop of the strip. @default 28 */
  duration?: number;
  /** Scroll container to watch; the window when left out. */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

/**
 * A header with a scrolling announcement strip above the navigation. The strip pauses on hover or
 * focus, can be dismissed, and tucks away (grid-rows collapse) once the page scrolls.
 */
export function TickerHeader({ brand, items, actions = [], announcements, duration = 28, scrollContainer, label = "Main", className }: TickerHeaderProps) {
  const reduceMotion = useReducedMotion();
  const { y } = useScrollState(scrollContainer);
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);
  const showStrip = !dismissed && y < 24;
  const loop = [...announcements, ...announcements];
  return (
    <header className={cn("@container sticky top-0 z-40 border-b border-black/[0.06] bg-white/90 backdrop-blur-xl", className)}>
      <div className={cn("grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none", showStrip ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="min-h-0 overflow-hidden" inert={!showStrip}>
          <div
            role="region"
            aria-label="Announcements"
            className="relative flex h-8 items-center overflow-hidden border-b border-black/[0.06] bg-[#fafafa] text-[12px] text-[#3f3f46] [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            {reduceMotion ? (
              <p className="w-full truncate px-10 text-center">{announcements[0]}</p>
            ) : (
              <motion.div
                className="flex shrink-0 gap-10 pr-10 whitespace-nowrap"
                animate={paused ? undefined : { x: ["0%", "-50%"] }}
                transition={{ duration, ease: "linear", repeat: Infinity }}
              >
                {loop.map((msg, i) => (
                  <span key={i} aria-hidden={i >= announcements.length || undefined} className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-1 rounded-full bg-[#f97316]" />
                    {msg}
                  </span>
                ))}
              </motion.div>
            )}
            <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss announcements" className="absolute right-1.5 grid size-6 cursor-pointer place-items-center rounded-md bg-[#fafafa] text-[#71717a] outline-none hover:text-[#09090b] focus-visible:ring-2 focus-visible:ring-ring">
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <nav aria-label={label} className="relative mx-auto flex h-14 max-w-6xl items-center gap-1 px-4">
        <div className="mr-4">{brand}</div>
        <ul className="hidden items-center @2xl:flex">
          {items.map((item) => (
            <li key={item.label}>
              <a href={item.href ?? item.items?.[0]?.href ?? "#"} className="flex h-9 items-center rounded-md px-3 text-[14px] text-[#3f3f46] outline-none hover:text-[#09090b] focus-visible:ring-2 focus-visible:ring-ring">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto hidden items-center gap-2 @2xl:flex">
          {actions.map((a, i) => (
            <a key={a.label} href={a.href} className={cn("flex h-9 items-center rounded-md px-3.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring", i === actions.length - 1 ? "bg-[#09090b] font-medium text-white hover:bg-black/80" : "text-[#3f3f46] hover:text-[#09090b]")}>
              {a.label}
            </a>
          ))}
        </div>
        <div className="ml-auto @2xl:hidden">
          <MobileMenu items={items} actions={actions} />
        </div>
      </nav>
    </header>
  );
}
