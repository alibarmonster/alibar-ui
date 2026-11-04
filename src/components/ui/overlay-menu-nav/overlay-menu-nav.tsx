"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavLink } from "@/lib/nav/types";

export interface OverlayMenuLink extends NavLink {
  /** A small tag beside the link, e.g. "We're hiring". */
  badge?: string;
}

export interface OverlayMenuGroup {
  title: string;
  links: OverlayMenuLink[];
}

export interface OverlayMenuFeature {
  title: string;
  href: string;
  /** Image URL for the card. */
  image: string;
  /** Alternative text for the image; leave empty when the title says it all. @default "" */
  alt?: string;
  /** Small label under the title, e.g. a category. */
  tag?: string;
}

export interface OverlayMenuNavProps {
  /** Logo and name; it stays visible above the open menu. */
  brand: ReactNode;
  /** Columns of links. */
  groups: OverlayMenuGroup[];
  /** Up to two image cards on the right, e.g. recent stories. */
  features?: OverlayMenuFeature[];
  /** Text color of the closed bar: dark text for light pages, or white for dark ones. @default "light" */
  tone?: "light" | "dark";
  /** Classes for the overlay, e.g. a height when the navbar lives in a panel. @default "h-dvh" */
  overlayClassName?: string;
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path d="M8 1v4M8 11v4M1 8h4M11 8h4M3 3l2.5 2.5M10.5 10.5 13 13M13 3l-2.5 2.5M5.5 10.5 3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A quiet bar with a mono MENU button that opens a dark, blurred overlay over the page: columns of
 * links with small mono headings and optional badges, plus image cards for recent stories. The
 * columns and cards rise in one after another; Escape closes it.
 */
export function OverlayMenuNav({ brand, groups, features = [], tone = "light", overlayClassName = "h-dvh", label = "Main", className }: OverlayMenuNavProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const light = tone === "light" && !open;

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
  const rise = (i: number) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: EASE, delay: 0.1 + i * 0.06 } };

  return (
    <header className={cn("@container sticky top-0 z-40", className)}>
      <div className="relative z-10 mx-auto flex h-16 max-w-6xl items-center px-5">
        <div className={cn("mr-auto transition-colors duration-300", light ? "text-[#0b0b0c]" : "text-white")}>{brand}</div>
        <button
          ref={toggle}
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-overlay`}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "group flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 font-mono text-[12px] tracking-[0.08em] uppercase outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#5b8cff] focus-visible:ring-offset-2",
            light ? "border-black/15 text-[#0b0b0c] hover:bg-black/[0.04] focus-visible:ring-offset-white" : "border-white/25 text-white hover:bg-white/10 focus-visible:ring-offset-[#0a0d14]",
          )}
        >
          <Spark className={cn("size-3.5 transition-transform duration-500 motion-reduce:transition-none", open ? "rotate-45" : "group-hover:rotate-90")} />
          <span className="relative h-4 overflow-hidden">
            <span className={cn("flex flex-col transition-transform duration-300 motion-reduce:transition-none", open && "-translate-y-1/2")}>
              <span className="h-4 leading-4">Menu</span>
              <span className="h-4 leading-4">Close</span>
            </span>
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            id={`${id}-overlay`}
            aria-label={label}
            className={cn("absolute inset-x-0 top-0 overflow-y-auto bg-[#070a12]/85 text-white backdrop-blur-2xl", overlayClassName)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="mx-auto grid max-w-6xl gap-x-8 gap-y-10 px-5 pt-24 pb-10 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="grid grid-cols-2 gap-x-6 gap-y-8 @5xl:grid-cols-3">
                {groups.map((group, g) => (
                  <motion.div key={group.title} {...rise(g)}>
                    <p className="font-mono text-[11.5px] tracking-[0.08em] text-white/45 uppercase">{group.title}</p>
                    <ul className="mt-4 grid gap-2.5">
                      {group.links.map((link) => (
                        <li key={link.label} className="flex flex-wrap items-center gap-2">
                          <a href={link.href} onClick={close} className="relative rounded-sm text-[15px] text-white/90 outline-none after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100 focus-visible:ring-2 focus-visible:ring-[#5b8cff]">
                            {link.label}
                          </a>
                          {link.badge ? <span className="rounded-[3px] bg-white/10 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-white/70 uppercase">{link.badge}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
              {features.length ? (
                <ul className="grid grid-cols-2 gap-4">
                  {features.slice(0, 2).map((f, i) => (
                    <motion.li key={f.title} {...rise(groups.length + i)}>
                      <a href={f.href} onClick={close} className="group block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#5b8cff] focus-visible:ring-offset-4 focus-visible:ring-offset-[#070a12]">
                        <motion.div
                          className="aspect-[4/3] overflow-hidden @5xl:aspect-square rounded-[3px] bg-white/5"
                          initial={reduceMotion ? false : { clipPath: "inset(100% 0 0 0)" }}
                          animate={{ clipPath: "inset(0% 0 0 0)" }}
                          transition={{ duration: 0.8, ease: EASE, delay: 0.2 + i * 0.08 }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic */}
                          <img src={f.image} alt={f.alt ?? ""} className="size-full scale-[1.06] object-cover transition-transform duration-700 ease-out group-hover:scale-100 motion-reduce:transition-none" />
                        </motion.div>
                        <span className="mt-3 flex items-start justify-between gap-3">
                          <span className="text-[15px] leading-snug text-white/90 group-hover:text-white">{f.title}</span>
                          <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-white/60 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" aria-hidden="true" />
                        </span>
                        {f.tag ? <span className="mt-2 block font-mono text-[11px] tracking-[0.08em] text-white/45 uppercase">{f.tag}</span> : null}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              ) : null}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
