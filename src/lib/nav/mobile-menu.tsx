"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavAction, NavItem } from "@/lib/nav/types";

export interface MobileMenuProps {
  items: NavItem[];
  actions?: NavAction[];
  /** Colors for light or dark navbars. @default "light" */
  tone?: "light" | "dark";
  /** Classes for the toggle button. */
  className?: string;
  /** Classes for the panel, to place it under narrow navbars. */
  panelClassName?: string;
}

/**
 * The compact menu every navbar falls back to on narrow widths: a hamburger that morphs into an X,
 * and a panel with expandable groups and the actions. Escape closes it and returns focus.
 */
export function MobileMenu({ items, actions = [], tone = "light", className, panelClassName }: MobileMenuProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const dark = tone === "dark";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      document.getElementById(`${id}-toggle`)?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, id]);

  const line = cn("absolute left-1/2 h-[1.5px] w-4 -translate-x-1/2 rounded-full transition-transform duration-300 motion-reduce:transition-none", dark ? "bg-white" : "bg-[#0b0b0c]");

  return (
    <>
      <button
        id={`${id}-toggle`}
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className={cn("relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", dark ? "hover:bg-white/10" : "hover:bg-black/5", className)}
      >
        <span aria-hidden="true" className={cn(line, open ? "top-1/2 rotate-45" : "top-[13px]")} />
        <span aria-hidden="true" className={cn(line, open ? "top-1/2 -rotate-45" : "top-[21px]")} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={`${id}-panel`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn("absolute inset-x-2 top-full z-50 mt-2 origin-top rounded-2xl border p-2 shadow-xl", dark ? "border-white/10 bg-[#111113] text-white" : "border-black/[0.06] bg-white text-[#0b0b0c]", panelClassName)}
          >
            <ul>
              {items.map((item) =>
                item.items?.length ? (
                  <li key={item.label}>
                    <button
                      type="button"
                      aria-expanded={group === item.label}
                      onClick={() => setGroup((g) => (g === item.label ? null : item.label))}
                      className={cn("flex h-11 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-[15px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", dark ? "hover:bg-white/5" : "hover:bg-black/[0.03]")}
                    >
                      {item.label}
                      <ChevronDown className={cn("size-4 opacity-60 transition-transform", group === item.label && "rotate-180")} aria-hidden="true" />
                    </button>
                    <div className={cn("grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none", group === item.label ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                      <ul className="min-h-0 overflow-hidden" inert={group !== item.label}>
                        {item.items.map((link) => (
                          <li key={link.label}>
                            <a href={link.href} className={cn("flex items-center gap-2.5 rounded-lg py-2 pr-3 pl-6 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring", dark ? "text-white/75 hover:text-white" : "text-[#52525b] hover:text-[#0b0b0c]")}>
                              {link.icon ? <span aria-hidden="true" className="opacity-70 [&_svg]:size-4">{link.icon}</span> : null}
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ) : (
                  <li key={item.label}>
                    <a href={item.href ?? "#"} className={cn("flex h-11 items-center rounded-xl px-3 text-[15px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", dark ? "hover:bg-white/5" : "hover:bg-black/[0.03]")}>
                      {item.label}
                    </a>
                  </li>
                ),
              )}
            </ul>
            {actions.length ? (
              <div className={cn("mt-2 grid gap-2 border-t pt-3", dark ? "border-white/10" : "border-black/[0.06]")}>
                {actions.map((a, i) => (
                  <a
                    key={a.label}
                    href={a.href}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-xl text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      i === actions.length - 1 ? (dark ? "bg-white text-[#0b0b0c]" : "bg-[#0b0b0c] text-white") : dark ? "border border-white/15" : "border border-black/10",
                    )}
                  >
                    {a.label}
                  </a>
                ))}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
