"use client";

import { useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction, NavItem, NavLink } from "@/lib/nav/types";
import { useMenu } from "@/lib/nav/use-menu";

export interface DuoPanelMenuItem extends NavItem {
  /** Highlighted links for the dark side of this item's panel. */
  featured?: NavLink[];
  /** Label above the featured links. @default "Featured" */
  featuredLabel?: string;
}

export interface DuoPanelMenuProps {
  /** Logo and name. */
  brand: ReactNode;
  /** Entries; those with `items` open a two-sided panel (and `featured` fills its dark side). */
  items: DuoPanelMenuItem[];
  /** Actions on the right; the last one is filled. */
  actions?: NavAction[];
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

/**
 * A navbar whose menus open a two-sided panel: a light column of links with descriptions beside a dark
 * column of featured links. The dark side slides in a beat after the light one.
 */
export function DuoPanelMenu({ brand, items, actions = [], label = "Main", className }: DuoPanelMenuProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const menu = useMenu(root);
  const openItem = items.find((i) => i.label === menu.open);
  return (
    <header ref={root} className={cn("@container sticky top-0 z-40 px-3 pt-3", className)}>
      <nav aria-label={label} className="relative mx-auto flex h-14 max-w-5xl items-center gap-1 rounded-2xl border border-black/[0.06] bg-white px-2 shadow-[0_8px_24px_-14px_rgb(0_0_0/0.3)]">
        <div className="mr-3 pl-2">{brand}</div>
        <ul className="hidden items-center @2xl:flex">
          {items.map((item) =>
            item.items?.length ? (
              <li key={item.label}>
                <button
                  type="button"
                  {...menu.triggerProps(item.label, `${id}-panel`)}
                  className={cn("flex h-9 whitespace-nowrap cursor-pointer items-center gap-1 rounded-lg px-3 text-[14px] font-medium text-[#18181b] outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-ring", menu.open === item.label && "bg-black/[0.06]")}
                >
                  {item.label}
                  <ChevronDown className={cn("size-3.5 transition-transform", menu.open === item.label && "rotate-180")} aria-hidden="true" />
                </button>
              </li>
            ) : (
              <li key={item.label}>
                <a href={item.href ?? "#"} className="flex h-9 whitespace-nowrap items-center rounded-lg px-3 text-[14px] font-medium text-[#18181b] outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-ring">
                  {item.label}
                </a>
              </li>
            ),
          )}
        </ul>
        <div className="ml-auto hidden items-center gap-1.5 @2xl:flex">
          {actions.map((a, i) => (
            <a
              key={a.label}
              href={a.href}
              className={cn(
                "flex h-9 whitespace-nowrap items-center rounded-full px-4 text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                i === actions.length - 1 ? "bg-[#111] text-white hover:bg-black/80" : "border border-black/15 text-[#18181b] hover:bg-black/[0.04]",
              )}
            >
              {a.label}
            </a>
          ))}
        </div>
        <div className="ml-auto @2xl:hidden">
          <MobileMenu items={items} actions={actions} />
        </div>

        <AnimatePresence>
          {openItem?.items ? (
            <motion.div
              id={`${id}-panel`}
              key={openItem.label}
              {...menu.panelProps}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-full left-0 z-50 mt-2 grid w-[min(40rem,100%)] grid-cols-[1fr_1fr] gap-2 rounded-2xl border border-black/[0.06] bg-white p-2 shadow-2xl"
            >
              <ul className="p-2">
                {openItem.items.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} onClick={menu.close} className="block rounded-lg px-2.5 py-2 outline-none hover:bg-black/[0.04] focus-visible:bg-black/[0.04]">
                      <span className="block text-[16px] font-medium text-[#18181b]">{link.label}</span>
                      {link.description ? <span className="block text-[13px] text-[#71717a]">{link.description}</span> : null}
                    </a>
                  </li>
                ))}
              </ul>
              {openItem.featured?.length ? (
                <motion.div
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: reduceMotion ? 0 : 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-xl bg-[#121212] p-4 text-white"
                >
                  <p className="flex items-center gap-2 text-[12px] text-white/70">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-white" />
                    {openItem.featuredLabel ?? "Featured"}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {openItem.featured.map((link) => (
                      <li key={link.label}>
                        <a href={link.href} onClick={menu.close} className="block rounded-md py-1 text-[16px] text-white/90 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/60">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>
    </header>
  );
}
