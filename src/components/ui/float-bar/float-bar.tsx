"use client";

import { useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction, NavItem } from "@/lib/nav/types";
import { useMenu } from "@/lib/nav/use-menu";

export interface FloatBarProps {
  /** Logo and name. */
  brand: ReactNode;
  /** Top-level entries; entries with `items` open a dropdown. */
  items: NavItem[];
  /** A quiet secondary action, e.g. "Sign in". */
  secondary?: NavAction;
  /** The primary call to action. */
  cta?: NavAction;
  /** Primary button color. @default "#1463ff" */
  accent?: string;
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

/**
 * A full-width bar floating just below the top edge: frosted white, softly shadowed, with dropdowns
 * whose chevrons turn as they open, a quiet sign-in link and a solid accent button.
 */
export function FloatBar({ brand, items, secondary, cta, accent = "#1463ff", label = "Main", className }: FloatBarProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const menu = useMenu(root);
  const actions = [secondary, cta].filter(Boolean) as NavAction[];
  return (
    <header ref={root} className={cn("@container sticky top-0 z-40 px-3 pt-3", className)}>
      <nav aria-label={label} className="relative mx-auto flex h-14 max-w-5xl items-center gap-2 rounded-2xl border border-black/[0.06] bg-white/85 px-3 shadow-[0_10px_30px_-14px_rgb(15_23_42/0.25)] backdrop-blur-xl">
        <div className="mr-4 pl-1">{brand}</div>
        <ul className="hidden items-center gap-0.5 @2xl:flex">
          {items.map((item) => {
            const panelId = `${id}-${item.label}`;
            if (!item.items?.length) {
              return (
                <li key={item.label}>
                  <a href={item.href ?? "#"} className="flex h-9 whitespace-nowrap items-center rounded-lg px-3 text-[14px] font-medium text-[#27272a] outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-ring">
                    {item.label}
                  </a>
                </li>
              );
            }
            const open = menu.open === item.label;
            return (
              <li key={item.label} className="relative">
                <button type="button" {...menu.triggerProps(item.label, panelId)} className="flex h-9 whitespace-nowrap cursor-pointer items-center gap-1 rounded-lg px-3 text-[14px] font-medium text-[#27272a] outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-ring">
                  {item.label}
                  <ChevronDown className={cn("size-3.5 text-[#71717a] transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
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
                      className="absolute top-full left-0 z-50 mt-2 w-64 rounded-xl border border-black/[0.06] bg-white p-1.5 shadow-xl"
                    >
                      <ul>
                        {item.items.map((link) => (
                          <li key={link.label}>
                            <a href={link.href} onClick={menu.close} className="block rounded-lg px-3 py-2 outline-none hover:bg-black/[0.04] focus-visible:bg-black/[0.04]">
                              <span className="block text-[14px] font-medium text-[#18181b]">{link.label}</span>
                              {link.description ? <span className="block text-[12px] text-[#71717a]">{link.description}</span> : null}
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
          {secondary ? (
            <a href={secondary.href} className="flex h-9 whitespace-nowrap items-center rounded-lg px-3 text-[14px] font-medium text-[#27272a] outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-ring">
              {secondary.label}
            </a>
          ) : null}
          {cta ? (
            <a href={cta.href} className="flex h-9 whitespace-nowrap items-center rounded-[10px] px-4 text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" style={{ background: accent }}>
              {cta.label}
            </a>
          ) : null}
        </div>
        <div className="ml-auto @2xl:hidden">
          <MobileMenu items={items} actions={actions} />
        </div>
      </nav>
    </header>
  );
}
