"use client";

import { useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction, NavItem } from "@/lib/nav/types";
import { useMenu } from "@/lib/nav/use-menu";

export interface SplitIslandsProps {
  /** Logo mark (an icon works best on the left island). */
  brand: ReactNode;
  /** Menus on the left island; entries with `items` open a dropdown. */
  items: NavItem[];
  /** Plain links on the right island, before the actions, e.g. Pricing. */
  links?: NavItem[];
  /** An outlined action, e.g. "Log in". */
  secondary?: NavAction;
  /** The filled call to action. */
  cta?: NavAction;
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

/**
 * Two separate floating islands: brand and menus on the left, links and actions on the right, with the
 * page showing through the space between. Menus open under the left island with a soft fade.
 */
export function SplitIslands({ brand, items, links = [], secondary, cta, label = "Main", className }: SplitIslandsProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const menu = useMenu(root);
  const island = "flex h-12 items-center gap-0.5 rounded-xl border border-black/[0.05] bg-white px-1.5 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.3)]";
  const pill = "flex h-9 whitespace-nowrap items-center rounded-lg px-3 text-[14px] font-medium text-[#18181b] outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <header ref={root} className={cn("@container sticky top-0 z-40 px-3 pt-3", className)}>
      <nav aria-label={label} className="relative flex items-start justify-between gap-3">
        <div className={island}>
          <div className="px-2.5">{brand}</div>
          <ul className="hidden items-center gap-0.5 @2xl:flex">
            {items.map((item) => {
              const panelId = `${id}-${item.label}`;
              const open = menu.open === item.label;
              if (!item.items?.length) {
                return (
                  <li key={item.label}>
                    <a href={item.href ?? "#"} className={pill}>
                      {item.label}
                    </a>
                  </li>
                );
              }
              return (
                <li key={item.label} className="relative">
                  <button type="button" {...menu.triggerProps(item.label, panelId)} className={cn(pill, "cursor-pointer gap-1", open && "bg-black/[0.05]")}>
                    {item.label}
                    <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
                  </button>
                  <AnimatePresence>
                    {open ? (
                      <motion.div
                        id={panelId}
                        {...menu.panelProps}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 z-50 mt-3 w-72 rounded-xl border border-black/[0.06] bg-white p-2 shadow-xl"
                      >
                        <ul>
                          {item.items.map((link) => (
                            <li key={link.label}>
                              <a href={link.href} onClick={menu.close} className="block rounded-lg px-3 py-2 outline-none hover:bg-black/[0.04] focus-visible:bg-black/[0.04]">
                                <span className="block text-[15px] font-medium text-[#18181b]">{link.label}</span>
                                {link.description ? <span className="block text-[12.5px] text-[#71717a]">{link.description}</span> : null}
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
        </div>
        <div className={cn(island, "hidden gap-1 @2xl:flex")}>
          {links.map((link) => (
            <a key={link.label} href={link.href ?? "#"} className={pill}>
              {link.label}
            </a>
          ))}
          {secondary ? (
            <a href={secondary.href} className="flex h-9 whitespace-nowrap items-center rounded-full border border-black/80 px-4 text-[14px] font-medium text-[#18181b] outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-ring">
              {secondary.label}
            </a>
          ) : null}
          {cta ? (
            <a href={cta.href} className="flex h-9 whitespace-nowrap items-center rounded-full bg-[#0b0b0c] px-4 text-[14px] font-medium text-white outline-none hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {cta.label}
            </a>
          ) : null}
        </div>
        <div className={cn(island, "@2xl:hidden")}>
          <MobileMenu items={[...items, ...links]} actions={[secondary, cta].filter(Boolean) as NavAction[]} />
        </div>
      </nav>
    </header>
  );
}
