"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavAction, NavItem, NavLink } from "@/lib/nav/types";

export interface SheetNavProps {
  /** Logo and name; it stays visible above the open sheet. */
  brand: ReactNode;
  /** Big links in the sheet; entries with `items` expand in place. */
  items: NavItem[];
  /** Smaller links in the sheet's side column, e.g. contact or socials. */
  aside?: NavLink[];
  /** Heading above the side column. @default "Elsewhere" */
  asideLabel?: string;
  /** Actions along the sheet's bottom edge; the last one is filled. */
  actions?: NavAction[];
  /** One action kept on the bar beside the menu button. */
  cta?: NavAction;
  /** Sheet background. @default "#f3efe7" */
  background?: string;
  /** Classes for the sheet, e.g. a height when the navbar lives in a panel. @default "h-dvh" */
  sheetClassName?: string;
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * A minimal bar whose "Menu" button grows a full sheet out of its corner, with oversized links
 * that rise in one after another, groups that expand in place, a side column and actions at the
 * bottom. Escape closes it and returns focus to the button.
 */
export function SheetNav({ brand, items, aside = [], asideLabel = "Elsewhere", actions = [], cta, background = "#f3efe7", sheetClassName = "h-dvh", label = "Main", className }: SheetNavProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);
  const corner = "calc(100% - 52px) 32px";
  const line = "absolute left-1/2 h-[1.5px] w-4 -translate-x-1/2 rounded-full bg-current transition-transform duration-300 motion-reduce:transition-none";
  const rise = (i: number) =>
    reduceMotion
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.2 },
        }
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, ease: EASE, delay: 0.12 + i * 0.05 },
        };

  return (
    <header className={cn("@container sticky top-0 z-40", className)}>
      <div className={cn("relative z-10 transition-[background-color,backdrop-filter] duration-300", !open && "bg-white/70 backdrop-blur-xl")}>
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <div className="mr-auto">{brand}</div>
          {cta ? (
            <a
              href={cta.href}
              className={cn(
                "hidden h-10 items-center rounded-full border border-black/10 px-4 text-[14px] font-medium text-[#0b0b0c] outline-none transition-opacity hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-ring @md:flex",
                open && "pointer-events-none opacity-0",
              )}
              tabIndex={open ? -1 : undefined}
            >
              {cta.label}
            </a>
          ) : null}
          <button
            ref={toggle}
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-sheet`}
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 cursor-pointer items-center gap-2.5 rounded-full bg-[#0b0b0c] pr-2 pl-4 text-[14px] font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="relative h-5 overflow-hidden">
              <span className={cn("flex flex-col transition-transform duration-300 motion-reduce:transition-none", open && "-translate-y-1/2")}>
                <span className="h-5 leading-5">Menu</span>
                <span className="h-5 leading-5">Close</span>
              </span>
            </span>
            <span aria-hidden="true" className="relative grid size-7 place-items-center rounded-full bg-white/15">
              <span className={cn(line, open ? "top-1/2 rotate-45" : "top-[11px]")} />
              <span className={cn(line, open ? "top-1/2 -rotate-45" : "top-[16px]")} />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            id={`${id}-sheet`}
            aria-label={label}
            className={cn("absolute inset-x-0 top-0 flex flex-col overflow-y-auto text-[#0b0b0c]", sheetClassName)}
            style={{ background }}
            initial={reduceMotion ? { opacity: 0 } : { clipPath: `circle(0% at ${corner})` }}
            animate={reduceMotion ? { opacity: 1 } : { clipPath: `circle(150% at ${corner})` }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : {
                    clipPath: `circle(0% at ${corner})`,
                    transition: { duration: 0.45, ease: [0.64, 0, 0.78, 0] },
                  }
            }
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 pt-24 pb-6 @2xl:grid-cols-[1fr_220px]">
              <ul className="self-start">
                {items.map((item, i) => {
                  const expandable = !!item.items?.length;
                  const expanded = group === item.label;
                  const big =
                    "group flex w-full items-center justify-between gap-4 border-b border-black/10 py-3 text-left text-[clamp(1.75rem,6cqi,3.25rem)] leading-none font-semibold tracking-[-0.03em] outline-none focus-visible:ring-2 focus-visible:ring-ring";
                  return (
                    <motion.li key={item.label} {...rise(i)}>
                      {expandable ? (
                        <>
                          <button type="button" aria-expanded={expanded} onClick={() => setGroup((g) => (g === item.label ? null : item.label))} className={cn(big, "cursor-pointer")}>
                            <span className="transition-transform duration-300 group-hover:translate-x-1.5 motion-reduce:transition-none">{item.label}</span>
                            <Plus className={cn("size-6 shrink-0 opacity-50 transition-transform duration-300", expanded && "rotate-45")} aria-hidden="true" />
                          </button>
                          <div className={cn("grid transition-[grid-template-rows] duration-400 ease-out motion-reduce:transition-none", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                            <ul className="grid min-h-0 gap-x-6 overflow-hidden @xl:grid-cols-2" inert={!expanded}>
                              {item.items!.map((l) => (
                                <li key={l.label}>
                                  <a href={l.href} onClick={close} className="flex items-baseline gap-3 rounded-md py-2.5 outline-none first:mt-3 hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring">
                                    <span className="text-[17px] font-medium">{l.label}</span>
                                    {l.description ? <span className="truncate text-[13px] text-black/50">{l.description}</span> : null}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <a href={item.href ?? "#"} onClick={close} className={big}>
                          <span className="transition-transform duration-300 group-hover:translate-x-1.5 motion-reduce:transition-none">{item.label}</span>
                          <ArrowUpRight className="size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-50" aria-hidden="true" />
                        </a>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
              {aside.length ? (
                <motion.div {...rise(items.length)} className="self-start @2xl:pt-3">
                  <p className="text-[12px] font-medium tracking-[0.08em] text-black/45 uppercase">{asideLabel}</p>
                  <ul className="mt-3 grid gap-1">
                    {aside.map((l) => (
                      <li key={l.label}>
                        <a href={l.href} onClick={close} className="group inline-flex items-center gap-1.5 rounded-md py-1 text-[15px] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                          {l.label}
                          <ArrowUpRight className="size-3.5 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : null}
            </div>
            {actions.length ? (
              <motion.div {...rise(items.length + 1)} className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-4 pb-6">
                {actions.map((a, i) => (
                  <a
                    key={a.label}
                    href={a.href}
                    onClick={close}
                    className={cn(
                      "flex h-12 flex-1 items-center justify-center rounded-full text-[15px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 @md:flex-none @md:px-7",
                      i === actions.length - 1 ? "bg-[#0b0b0c] text-white hover:bg-[#27272a]" : "border border-black/15 hover:bg-black/[0.04]",
                    )}
                  >
                    {a.label}
                  </a>
                ))}
              </motion.div>
            ) : null}
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
