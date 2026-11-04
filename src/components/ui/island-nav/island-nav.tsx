"use client";

import { type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction, NavItem } from "@/lib/nav/types";
import { useScrollState } from "@/lib/nav/use-scroll-state";

export interface IslandNavProps {
  /** Logo or app icon with a name. */
  brand: ReactNode;
  /** Top-level links. Items with `items` link to their first entry here. */
  items: NavItem[];
  /** The call to action on the right of the island. */
  cta?: NavAction;
  /** Scroll container to watch; the window when left out. */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

/**
 * A compact dark pill floating at the top center: brand, links and a bright call to action. Once the
 * page scrolls it tightens and lifts a little. Narrow widths swap the links for a menu.
 */
export function IslandNav({ brand, items, cta, scrollContainer, label = "Main", className }: IslandNavProps) {
  const reduceMotion = useReducedMotion();
  const { y } = useScrollState(scrollContainer);
  const scrolled = y > 12;
  return (
    <header className={cn("@container sticky top-0 z-40 flex justify-center px-3 pt-3", className)}>
      <motion.nav
        aria-label={label}
        className="relative flex items-center gap-1 rounded-[18px] bg-[#0b0b0c] text-white shadow-[0_12px_30px_-12px_rgb(0_0_0/0.5)] ring-1 ring-white/10"
        initial={false}
        animate={{ paddingLeft: scrolled ? 8 : 12, paddingRight: scrolled ? 6 : 8, paddingTop: scrolled ? 6 : 8, paddingBottom: scrolled ? 6 : 8, y: scrolled ? 4 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
      >
        <div className="mr-3 flex items-center">{brand}</div>
        <ul className="hidden items-center @md:flex">
          {items.map((item) => (
            <li key={item.label}>
              <a href={item.href ?? item.items?.[0]?.href ?? "#"} className="flex h-8 whitespace-nowrap items-center rounded-lg px-3 text-[13px] text-white/70 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        {cta ? (
          <a href={cta.href} className="ml-2 hidden h-8 items-center rounded-[10px] bg-white px-3.5 text-[13px] font-medium text-[#0b0b0c] outline-none transition-transform hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0c] @md:inline-flex">
            {cta.label}
          </a>
        ) : null}
        <div className="ml-auto @md:hidden">
          <MobileMenu items={items} actions={cta ? [cta] : []} tone="dark" panelClassName="inset-x-auto left-1/2 w-72 -translate-x-1/2" />
        </div>
      </motion.nav>
    </header>
  );
}
