"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction, NavItem, NavLink } from "@/lib/nav/types";
import { useMenu } from "@/lib/nav/use-menu";

export interface CatalogGroup {
  title: string;
  links: NavLink[];
}

export interface CatalogMenuItem extends NavItem {
  /** Columns for this item's mega menu; overrides `items`. */
  groups?: CatalogGroup[];
  /** A highlighted card along the bottom of the menu. */
  spotlight?: NavLink;
}

export interface CatalogMenuProps {
  /** Logo and name. */
  brand: ReactNode;
  /** Entries; those with `groups` or `items` open the catalog. */
  items: CatalogMenuItem[];
  /** Actions on the right; the last one is filled. */
  actions?: NavAction[];
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

/**
 * A navbar with a catalog-style mega menu: columns of links with icons and one-line descriptions, a
 * soft highlight that glides to whichever link you point at, and a spotlight card along the bottom.
 */
export function CatalogMenu({ brand, items, actions = [], label = "Main", className }: CatalogMenuProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const menu = useMenu(root);
  const [hover, setHover] = useState<string | null>(null);
  const openItem = items.find((i) => i.label === menu.open);
  const groups = openItem?.groups ?? (openItem?.items ? [{ title: openItem.label, links: openItem.items }] : []);

  return (
    <header ref={root} className={cn("@container sticky top-0 z-40 bg-white/85 backdrop-blur-xl", className)}>
      <nav aria-label={label} className="relative mx-auto flex h-14 max-w-6xl items-center gap-1 px-4">
        <div className="mr-4">{brand}</div>
        <ul className="hidden items-center @2xl:flex">
          {items.map((item) =>
            item.groups?.length || item.items?.length ? (
              <li key={item.label}>
                <button
                  type="button"
                  {...menu.triggerProps(item.label, `${id}-panel`)}
                  className={cn("flex h-9 cursor-pointer items-center gap-1 rounded-md px-3 text-[14px] text-[#3f3f46] outline-none hover:text-[#09090b] focus-visible:ring-2 focus-visible:ring-ring", menu.open === item.label && "bg-black/[0.05] text-[#09090b]")}
                >
                  {item.label}
                  <ChevronDown className={cn("size-3.5 opacity-60 transition-transform", menu.open === item.label && "rotate-180")} aria-hidden="true" />
                </button>
              </li>
            ) : (
              <li key={item.label}>
                <a href={item.href ?? "#"} className="flex h-9 items-center rounded-md px-3 text-[14px] text-[#3f3f46] outline-none hover:text-[#09090b] focus-visible:ring-2 focus-visible:ring-ring">
                  {item.label}
                </a>
              </li>
            ),
          )}
        </ul>
        <div className="ml-auto hidden items-center gap-2 @2xl:flex">
          {actions.map((a, i) => (
            <a
              key={a.label}
              href={a.href}
              className={cn(
                "h-9 items-center rounded-md px-3.5 text-[14px] whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring",
                // Middle actions wait for room; the first and last always show.
                i > 0 && i < actions.length - 1 ? "hidden @4xl:flex" : "flex",
                i === actions.length - 1 ? "border border-[#c2410c]/40 bg-[#fff7ed] font-medium text-[#9a3412] hover:bg-[#ffedd5]" : "text-[#3f3f46] hover:text-[#09090b]",
              )}
            >
              {a.label}
            </a>
          ))}
        </div>
        <div className="ml-auto @2xl:hidden">
          <MobileMenu items={items.map((i) => ({ label: i.label, href: i.href, items: i.groups ? i.groups.flatMap((g) => g.links) : i.items }))} actions={actions} />
        </div>

        <AnimatePresence>
          {openItem && groups.length ? (
            <motion.div
              id={`${id}-panel`}
              key={openItem.label}
              {...menu.panelProps}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-full left-4 z-50 mt-1 w-[min(46rem,calc(100%-2rem))] origin-top-left rounded-xl border border-black/[0.08] bg-white p-3 shadow-2xl"
              onPointerLeave={() => setHover(null)}
            >
              <LayoutGroup id={`${id}-hover`}>
                <div className={cn("grid gap-4", groups.length > 2 ? "grid-cols-2 @4xl:grid-cols-3" : groups.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                  {groups.map((group) => (
                    <div key={group.title}>
                      <p className="px-2.5 pt-1 pb-2 text-[11px] font-medium tracking-wide text-[#a1a1aa] uppercase">{group.title}</p>
                      <ul>
                        {group.links.map((link) => (
                          <li key={link.label}>
                            <a
                              href={link.href}
                              onClick={menu.close}
                              onPointerEnter={() => setHover(link.label)}
                              onFocus={() => setHover(link.label)}
                              className="relative flex gap-3 rounded-lg px-2.5 py-2 outline-none"
                            >
                              {hover === link.label ? <motion.span layoutId="catalog-hover" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-lg bg-[#f4f4f5]" /> : null}
                              {link.icon ? <span aria-hidden="true" className="relative mt-0.5 text-[#52525b] [&_svg]:size-[18px]">{link.icon}</span> : null}
                              <span className="relative">
                                <span className="block text-[14px] font-medium text-[#09090b]">{link.label}</span>
                                {link.description ? <span className="block text-[12.5px] text-[#71717a]">{link.description}</span> : null}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </LayoutGroup>
              {openItem.spotlight ? (
                <a
                  href={openItem.spotlight.href}
                  onClick={menu.close}
                  className="group mt-3 flex items-center gap-3 rounded-lg border border-dashed border-black/10 bg-[repeating-linear-gradient(135deg,#fafafa_0_6px,#f4f4f5_6px_7px)] px-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {openItem.spotlight.icon ? <span aria-hidden="true" className="text-[#52525b] [&_svg]:size-[18px]">{openItem.spotlight.icon}</span> : null}
                  <span className="flex-1">
                    <span className="block text-[14px] font-medium text-[#09090b]">{openItem.spotlight.label}</span>
                    {openItem.spotlight.description ? <span className="block text-[12.5px] text-[#71717a]">{openItem.spotlight.description}</span> : null}
                  </span>
                  <ArrowRight className="size-4 text-[#71717a] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>
    </header>
  );
}
