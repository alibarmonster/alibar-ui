"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction, NavItem } from "@/lib/nav/types";
import { useMenu } from "@/lib/nav/use-menu";

export interface CenterPillNavProps {
  /** Logo and name, on the left. */
  brand: ReactNode;
  /** Links inside the centered pill; entries with `items` open a dropdown. */
  items: NavItem[];
  /** Actions in the right pill; the last one is the accent button. */
  actions?: NavAction[];
  /** Accent button color. @default "#ff5b14" */
  accent?: string;
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

/**
 * Brand on the left, the links in a centered pill with a soft highlight that glides between them,
 * and a second pill on the right holding the quiet actions and a bright accent button.
 */
export function CenterPillNav({ brand, items, actions = [], accent = "#ff5b14", label = "Main", className }: CenterPillNavProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const menu = useMenu(root);
  const [hovered, setHovered] = useState<string | null>(null);
  const quiet = actions.slice(0, -1);
  const primary = actions.at(-1);
  const active = menu.open ?? hovered;
  const link = "relative flex h-9 whitespace-nowrap items-center gap-1 rounded-full px-3.5 text-[14px] font-medium text-[#27272a] outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const highlight = (key: string) =>
    active === key ? (
      <motion.span layoutId={`${id}-pill`} aria-hidden="true" className="absolute inset-0 -z-10 rounded-full bg-black/[0.06]" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }} />
    ) : null;

  return (
    <header ref={root} className={cn("@container sticky top-0 z-40 px-4 pt-4", className)}>
      <nav aria-label={label} className="relative mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-3 @2xl:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center pl-1">{brand}</div>
        <ul className="isolate hidden items-center rounded-full border border-black/[0.06] bg-white/90 p-1 shadow-[0_6px_20px_-12px_rgb(0_0_0/0.25)] backdrop-blur-xl @2xl:flex" onPointerLeave={() => setHovered(null)}>
          {items.map((item) => {
            const panelId = `${id}-${item.label}`;
            if (!item.items?.length) {
              return (
                <li key={item.label} className="relative isolate" onPointerEnter={() => setHovered(item.label)}>
                  {highlight(item.label)}
                  <a href={item.href ?? "#"} onFocus={() => setHovered(item.label)} onBlur={() => setHovered(null)} className={link}>
                    {item.label}
                  </a>
                </li>
              );
            }
            const open = menu.open === item.label;
            return (
              <li key={item.label} className="relative isolate" onPointerEnter={() => setHovered(item.label)}>
                {highlight(item.label)}
                <button type="button" {...menu.triggerProps(item.label, panelId)} className={cn(link, "cursor-pointer")}>
                  {item.label}
                  <ChevronDown className={cn("size-3.5 text-[#71717a] transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {open ? (
                    <motion.div
                      id={panelId}
                      {...menu.panelProps}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-full left-1/2 z-50 mt-3 w-[340px] origin-top -translate-x-1/2 rounded-3xl border border-black/[0.06] bg-white p-2 shadow-[0_24px_50px_-20px_rgb(0_0_0/0.3)]"
                    >
                      <ul className="grid gap-0.5">
                        {item.items.map((l) => (
                          <li key={l.label}>
                            <a href={l.href} onClick={menu.close} className="group flex items-start gap-3 rounded-2xl p-2.5 outline-none hover:bg-[#f6f6f7] focus-visible:bg-[#f6f6f7]">
                              {l.icon ? (
                                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f4f4f5] text-[#3f3f46] transition-colors group-hover:bg-white [&_svg]:size-[18px]">
                                  {l.icon}
                                </span>
                              ) : null}
                              <span>
                                <span className="block text-[14px] font-medium text-[#18181b]">{l.label}</span>
                                {l.description ? <span className="block text-[12.5px] leading-snug text-[#71717a]">{l.description}</span> : null}
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
        <div className="hidden justify-self-end @2xl:block">
          {actions.length ? (
            <div className="flex items-center gap-1 rounded-full border border-black/[0.06] bg-white/90 p-1 shadow-[0_6px_20px_-12px_rgb(0_0_0/0.25)] backdrop-blur-xl">
              {quiet.map((a, i) => (
                // Only the first quiet action shows until there is room for more.
                <a
                  key={a.label}
                  href={a.href}
                  className={cn(
                    "flex h-9 items-center rounded-full px-3.5 text-[14px] font-medium whitespace-nowrap text-[#27272a] outline-none hover:bg-black/[0.05] focus-visible:ring-2 focus-visible:ring-ring",
                    i > 0 && "hidden @4xl:flex",
                  )}
                >
                  {a.label}
                </a>
              ))}
              {primary ? (
                <a
                  href={primary.href}
                  className="flex h-9 whitespace-nowrap items-center rounded-full px-4 text-[14px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{ background: accent }}
                >
                  {primary.label}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="justify-self-end rounded-full border border-black/[0.06] bg-white p-0.5 shadow-sm @2xl:hidden">
          <MobileMenu items={items} actions={actions} />
        </div>
      </nav>
    </header>
  );
}
