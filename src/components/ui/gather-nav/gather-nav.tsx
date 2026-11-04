"use client";

import { useId, useState, type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction, NavItem } from "@/lib/nav/types";
import { useScrollState } from "@/lib/nav/use-scroll-state";

export interface GatherNavProps {
  /** Logo or wordmark. */
  brand: ReactNode;
  /** Links; they gather into a frosted pill once the page scrolls. */
  items: NavItem[];
  /** The filled call to action. */
  cta?: NavAction;
  /** Shows a search button and calls this when it is pressed. */
  onSearch?: () => void;
  /** Accessible name for the search button. @default "Search" */
  searchLabel?: string;
  /** Scroll container to watch; the window when left out. */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** Scroll offset in px at which the bar gathers; 0 keeps it gathered. @default 16 */
  gatherAfter?: number;
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * A plain white bar with a hairline that, once the page scrolls, melts away: its background fades,
 * the links draw together into a frosted pill, and the brand, search and call to action float on
 * their own over the content. A soft highlight glides between the links on hover.
 */
export function GatherNav({ brand, items, cta, onSearch, searchLabel = "Search", scrollContainer, gatherAfter = 16, label = "Main", className }: GatherNavProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const { y } = useScrollState(scrollContainer);
  const gathered = y >= gatherAfter;
  const [hover, setHover] = useState<string | null>(null);
  const fade = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: EASE };
  const frost = "bg-white/75 shadow-[0_6px_24px_-10px_rgb(0_0_0/0.18),inset_0_0_0_1px_rgb(0_0_0/0.05)] backdrop-blur-xl backdrop-saturate-150";

  /** A frosted backing that appears only while gathered. */
  const backing = (cls: string) => (
    <motion.span
      aria-hidden="true"
      className={cn("absolute -z-10", frost, cls)}
      initial={false}
      animate={gathered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduceMotion ? 1 : 0.94 }}
      transition={fade}
    />
  );

  return (
    <header className={cn("@container sticky top-0 z-40", className)}>
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 border-b border-black/[0.07] bg-white"
        initial={false}
        animate={{ opacity: gathered ? 0 : 1 }}
        transition={fade}
      />
      <nav aria-label={label} className="relative mx-auto flex h-16 max-w-6xl items-center gap-2 px-5">
        <div className="relative isolate mr-auto flex items-center">
          {/* The wordmark keeps a soft haze around it so it stays readable over busy pages. */}
          {backing("-inset-x-3 -inset-y-1.5 rounded-full !bg-white/60 !shadow-none blur-[2px]")}
          {brand}
        </div>

        <ul className="relative isolate hidden items-center p-1 @2xl:flex" onPointerLeave={() => setHover(null)}>
          {backing("inset-0 rounded-full")}
          {items.map((item) => (
            <li key={item.label} className="relative">
              {hover === item.label ? (
                <motion.span layoutId={`${id}-hover`} aria-hidden="true" className="absolute inset-0 rounded-full bg-black/[0.05]" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }} />
              ) : null}
              <a
                href={item.href ?? item.items?.[0]?.href ?? "#"}
                onPointerEnter={() => setHover(item.label)}
                onFocus={() => setHover(item.label)}
                onBlur={() => setHover(null)}
                className="relative flex h-9 items-center rounded-full px-3.5 text-[14px] whitespace-nowrap text-[#27272a] outline-none transition-colors hover:text-[#09090b] focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {onSearch ? (
          <button type="button" onClick={onSearch} aria-label={searchLabel} className="relative isolate hidden size-10 cursor-pointer place-items-center rounded-full text-[#71717a] outline-none transition-colors hover:text-[#09090b] focus-visible:ring-2 focus-visible:ring-ring @2xl:grid">
            {backing("inset-0 rounded-full")}
            <Search className="size-[18px]" aria-hidden="true" />
          </button>
        ) : null}

        {cta ? (
          <a href={cta.href} className="hidden h-10 items-center rounded-full bg-[#141414] px-4.5 text-[14px] font-medium whitespace-nowrap text-white shadow-[0_6px_16px_-8px_rgb(0_0_0/0.5)] outline-none transition-colors hover:bg-[#2a2a2a] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 @2xl:flex">
            {cta.label}
          </a>
        ) : null}

        <div className="@2xl:hidden">
          <MobileMenu items={items} actions={cta ? [cta] : []} className={cn("transition-[background-color,box-shadow] duration-300", gathered && frost)} />
        </div>
      </nav>
    </header>
  );
}
