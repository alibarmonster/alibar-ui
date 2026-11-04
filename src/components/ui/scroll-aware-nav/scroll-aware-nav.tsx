"use client";

import { useId, useRef, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction, NavItem } from "@/lib/nav/types";
import { useMenu } from "@/lib/nav/use-menu";
import { useScrollState } from "@/lib/nav/use-scroll-state";

export interface ScrollAwareNavProps {
  /** Logo and name. */
  brand: ReactNode;
  /** Top-level entries; entries with `items` open a dropdown. */
  items: NavItem[];
  /** Actions on the right; the last one is the filled button. */
  actions?: NavAction[];
  /** Scroll container to watch; the window when left out. */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** Scroll offset in px after which the bar turns solid. @default 24 */
  solidAfter?: number;
  /** Hide the bar while scrolling down, show it again on the way up. @default true */
  hideOnScroll?: boolean;
  /** Show a reading progress line along the bottom edge. @default true */
  progress?: boolean;
  /** Color of the progress line. @default "#2563eb" */
  accent?: string;
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

/**
 * A bar that stays out of the way: see-through over the hero, frosted with a hairline once the page
 * scrolls, tucked away while you read down and back the moment you scroll up, with a thin progress
 * line along its bottom edge.
 */
export function ScrollAwareNav({ brand, items, actions = [], scrollContainer, solidAfter = 24, hideOnScroll = true, progress = true, accent = "#2563eb", label = "Main", className }: ScrollAwareNavProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const menu = useMenu(root);
  const scroll = useScrollState(scrollContainer);
  const solid = scroll.y > solidAfter;
  const hidden = hideOnScroll && scroll.direction === "down" && scroll.y > 160 && !menu.open;
  const primary = actions.at(-1);

  return (
    <motion.header
      ref={root}
      className={cn("@container sticky top-0 z-40", className)}
      initial={false}
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={cn(
          "absolute inset-0 -z-10 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 motion-reduce:transition-none",
          solid ? "border-black/[0.07] bg-white/80 shadow-[0_8px_24px_-18px_rgb(0_0_0/0.35)] backdrop-blur-xl" : "border-transparent bg-transparent",
        )}
        aria-hidden="true"
      />
      <nav aria-label={label} className={cn("relative mx-auto flex max-w-6xl items-center gap-2 px-4 transition-[height] duration-300 motion-reduce:transition-none", solid ? "h-14" : "h-[72px]")}>
        <div className="mr-6">{brand}</div>
        <ul className="hidden items-center gap-0.5 @2xl:flex">
          {items.map((item) => {
            const panelId = `${id}-${item.label}`;
            if (!item.items?.length) {
              return (
                <li key={item.label}>
                  <a href={item.href ?? "#"} className="flex h-9 whitespace-nowrap items-center rounded-md px-3 text-[14px] font-medium text-[#3f3f46] outline-none transition-colors hover:text-[#0b0b0c] focus-visible:ring-2 focus-visible:ring-ring">
                    {item.label}
                  </a>
                </li>
              );
            }
            const open = menu.open === item.label;
            return (
              <li key={item.label} className="relative">
                <button type="button" {...menu.triggerProps(item.label, panelId)} className="flex h-9 whitespace-nowrap cursor-pointer items-center gap-1 rounded-md px-3 text-[14px] font-medium text-[#3f3f46] outline-none transition-colors hover:text-[#0b0b0c] focus-visible:ring-2 focus-visible:ring-ring">
                  {item.label}
                  <ChevronDown className={cn("size-3.5 opacity-60 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {open ? (
                    <motion.div
                      id={panelId}
                      {...menu.panelProps}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-full left-0 z-50 mt-2 w-72 rounded-xl border border-black/[0.07] bg-white p-1.5 shadow-xl"
                    >
                      <ul>
                        {item.items.map((l) => (
                          <li key={l.label}>
                            <a href={l.href} onClick={menu.close} className="flex items-start gap-3 rounded-lg px-3 py-2.5 outline-none hover:bg-black/[0.04] focus-visible:bg-black/[0.04]">
                              {l.icon ? <span aria-hidden="true" className="mt-0.5 text-[#71717a] [&_svg]:size-4">{l.icon}</span> : null}
                              <span>
                                <span className="block text-[14px] font-medium text-[#18181b]">{l.label}</span>
                                {l.description ? <span className="block text-[12.5px] text-[#71717a]">{l.description}</span> : null}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
        <div className="ml-auto hidden items-center gap-1 @2xl:flex">
          {actions.slice(0, -1).map((a) => (
            <a key={a.label} href={a.href} className="flex h-9 whitespace-nowrap items-center rounded-md px-3 text-[14px] font-medium text-[#3f3f46] outline-none hover:text-[#0b0b0c] focus-visible:ring-2 focus-visible:ring-ring">
              {a.label}
            </a>
          ))}
          {primary ? (
            <a href={primary.href} className="flex h-9 whitespace-nowrap items-center rounded-lg bg-[#0b0b0c] px-4 text-[14px] font-medium text-white outline-none transition-colors hover:bg-[#27272a] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {primary.label}
            </a>
          ) : null}
        </div>
        <div className="ml-auto @2xl:hidden">
          <MobileMenu items={items} actions={actions} />
        </div>
      </nav>
      {progress ? (
        <div aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 h-[2px] origin-left transition-opacity duration-300", solid ? "opacity-100" : "opacity-0")} style={{ background: accent, transform: `scaleX(${scroll.progress})` }} />
      ) : null}
    </motion.header>
  );
}
