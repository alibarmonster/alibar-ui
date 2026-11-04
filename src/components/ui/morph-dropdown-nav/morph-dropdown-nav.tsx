"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction, NavItem } from "@/lib/nav/types";
import { useMenu } from "@/lib/nav/use-menu";

export interface MorphDropdownNavProps {
  /** Logo and name. */
  brand: ReactNode;
  /** Top-level entries; entries with `items` share the morphing panel. */
  items: NavItem[];
  /** Actions on the right; the last one is the filled button. */
  actions?: NavAction[];
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;
/** Menus with four or more links lay out in two columns. */
const widthOf = (item: NavItem) => ((item.items?.length ?? 0) >= 4 ? 520 : 300);

/**
 * A dark bar whose menus share one panel: moving between triggers, the panel glides across and
 * resizes to fit while the old content slides out in the direction you moved and the new one in.
 */
export function MorphDropdownNav({ brand, items, actions = [], label = "Main", className }: MorphDropdownNavProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const menu = useMenu(root);
  const [anchor, setAnchor] = useState({ center: 0, bound: 0 });
  const [height, setHeight] = useState(0);
  const [shown, setShown] = useState<{ key: string | null; dir: number }>({ key: null, dir: 0 });

  const index = (key: string | null) => items.findIndex((i) => i.label === key);
  if (menu.open !== shown.key) {
    setShown({ key: menu.open, dir: menu.open && shown.key ? Math.sign(index(menu.open) - index(shown.key)) : 0 });
  }

  const active = items.find((i) => i.label === menu.open && i.items?.length);
  const width = active ? widthOf(active) : 300;
  const left = Math.max(0, Math.min(anchor.bound - width, anchor.center - width / 2));

  useEffect(() => {
    const el = measure.current;
    if (!el || !active) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [active]);

  /** Remember where the trigger sits so the panel can center under it. */
  const aim = (e: { currentTarget: HTMLElement }) => {
    const nav = navRef.current?.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    if (nav) setAnchor({ center: r.left - nav.left + r.width / 2, bound: nav.width });
  };

  const slide = {
    enter: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 48 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -48 }),
  };
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 38 };
  const primary = actions.at(-1);

  return (
    <header ref={root} className={cn("@container sticky top-0 z-40 border-b border-white/[0.08] bg-[#09090b]/90 text-white backdrop-blur-xl", className)}>
      <nav ref={navRef} aria-label={label} className="relative mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <div className="mr-6">{brand}</div>
        <ul className="hidden items-center gap-0.5 @2xl:flex">
          {items.map((item) => {
            if (!item.items?.length) {
              return (
                <li key={item.label}>
                  <a href={item.href ?? "#"} className="flex h-9 whitespace-nowrap items-center rounded-full px-3.5 text-[14px] text-white/70 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/50">
                    {item.label}
                  </a>
                </li>
              );
            }
            const open = menu.open === item.label;
            return (
              <li key={item.label} onPointerEnter={aim} onFocus={aim}>
                <button
                  type="button"
                  {...menu.triggerProps(item.label, `${id}-panel`)}
                  className={cn("flex h-9 whitespace-nowrap cursor-pointer items-center gap-1 rounded-full px-3.5 text-[14px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/50", open ? "bg-white/10 text-white" : "text-white/70 hover:text-white")}
                >
                  {item.label}
                  <ChevronDown className={cn("size-3.5 opacity-60 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="ml-auto hidden items-center gap-1 @2xl:flex">
          {actions.slice(0, -1).map((a) => (
            <a key={a.label} href={a.href} className="flex h-9 whitespace-nowrap items-center rounded-full px-3.5 text-[14px] text-white/70 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/50">
              {a.label}
            </a>
          ))}
          {primary ? (
            <a href={primary.href} className="flex h-9 whitespace-nowrap items-center rounded-full bg-white px-4 text-[14px] font-medium text-[#09090b] outline-none transition-colors hover:bg-white/85 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]">
              {primary.label}
            </a>
          ) : null}
        </div>
        <div className="ml-auto @2xl:hidden">
          <MobileMenu items={items} actions={actions} tone="dark" />
        </div>

        <AnimatePresence>
          {active ? (
            <motion.div
              key="panel"
              id={`${id}-panel`}
              {...menu.panelProps}
              initial={reduceMotion ? { opacity: 0, x: left, width } : { opacity: 0, y: 8, scale: 0.98, x: left, width }}
              animate={{ opacity: 1, y: 0, scale: 1, x: left, width, height: height || "auto" }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : 6, transition: { duration: 0.14 } }}
              transition={{ ...spring, opacity: { duration: 0.18, ease: EASE } }}
              className="absolute top-[calc(100%-4px)] left-0 z-50 hidden origin-top overflow-hidden rounded-2xl border border-white/10 bg-[#141416] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.7)] @2xl:block"
            >
              <div ref={measure} className="relative">
                <AnimatePresence mode="popLayout" initial={false} custom={shown.dir}>
                  <motion.div
                    key={active.label}
                    custom={shown.dir}
                    variants={slide}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.26, ease: EASE }}
                    style={{ width: widthOf(active) }}
                    className="p-2"
                  >
                    <ul className={cn("grid gap-0.5", active.items!.length >= 4 && "grid-cols-2")}>
                      {active.items!.map((l) => (
                        <li key={l.label}>
                          <a href={l.href} onClick={menu.close} className="group flex items-start gap-3 rounded-xl p-3 outline-none hover:bg-white/[0.05] focus-visible:bg-white/[0.07]">
                            {l.icon ? (
                              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition-colors group-hover:text-white [&_svg]:size-4">
                                {l.icon}
                              </span>
                            ) : null}
                            <span>
                              <span className="block text-[14px] font-medium text-white">{l.label}</span>
                              {l.description ? <span className="mt-0.5 block text-[12.5px] leading-snug text-white/50">{l.description}</span> : null}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>
    </header>
  );
}
