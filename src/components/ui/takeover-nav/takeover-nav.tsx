"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav/types";

export interface TakeoverNavProps {
  /** Name shown on the bar, set in mono capitals. */
  name: string;
  /** Where the name links. @default "/" */
  nameHref?: string;
  /** Sections; they sit on the bar and become the giant words of the open menu. */
  items: NavItem[];
  /** Small texts for the corners of the open menu, e.g. addresses or a language switch. */
  corners?: { topLeft?: ReactNode; topRight?: ReactNode; bottomLeft?: ReactNode; bottomRight?: ReactNode };
  /** Color that floods the page when the menu opens. @default "#2f3cff" */
  accent?: string;
  /** Color of the giant words. @default "#f3efe6" */
  ink?: string;
  /** Classes for the open menu, e.g. a height when the navbar lives in a panel. @default "h-dvh" */
  menuClassName?: string;
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

const EASE = [0.76, 0, 0.24, 1] as const;
const OUT = [0.22, 1, 0.36, 1] as const;

/**
 * A smoky glass bar with a mono name, a few links and a four-dot button. Press the dots and the page
 * floods with color from the top, the bar draws in to the center, and the sections rise as giant
 * stretched words; hovering one fades the rest. Small corner texts frame the screen.
 */
export function TakeoverNav({ name, nameHref = "/", items, corners = {}, accent = "#2f3cff", ink = "#f3efe6", menuClassName = "h-dvh", label = "Main", className }: TakeoverNavProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

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

  const close = () => {
    setOpen(false);
    setHover(null);
  };
  const mono = "font-mono text-[12px] tracking-[0.08em] uppercase";
  const layout = reduceMotion ? { duration: 0 } : { duration: 0.7, ease: EASE };
  // Four dots that turn into a plus-like cross when open.
  const dots = [
    [-3.5, -3.5],
    [3.5, -3.5],
    [-3.5, 3.5],
    [3.5, 3.5],
  ];

  return (
    <header className={cn("@container sticky top-0 z-40 px-3 pt-3", className)}>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={`${id}-menu`}
            className={cn("absolute inset-x-0 top-0 overflow-hidden", menuClassName)}
            style={{ background: accent, color: ink }}
            initial={reduceMotion ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            animate={reduceMotion ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={reduceMotion ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)", transition: { duration: 0.6, ease: EASE, delay: 0.15 } }}
            transition={{ duration: 0.75, ease: EASE }}
          >
            <nav aria-label={`${label} menu`} className="flex h-full flex-col items-center justify-center px-4" onPointerLeave={() => setHover(null)}>
              <ul className="flex flex-col items-center">
                {items.map((item, i) => (
                  <li key={item.label} className="overflow-hidden">
                    <motion.a
                      href={item.href ?? item.items?.[0]?.href ?? "#"}
                      onClick={close}
                      onPointerEnter={() => setHover(item.label)}
                      onFocus={() => setHover(item.label)}
                      className="block rounded-sm text-center text-[clamp(2.75rem,13cqi,9.5rem)] leading-none font-extrabold tracking-[-0.06em] uppercase outline-none transition-opacity duration-300 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-inset"
                      style={{ opacity: hover && hover !== item.label ? 0.22 : 1 }}
                      initial={reduceMotion ? { opacity: 0 } : { y: "110%" }}
                      animate={reduceMotion ? { opacity: 1 } : { y: "0%" }}
                      exit={reduceMotion ? { opacity: 0 } : { y: "-110%", transition: { duration: 0.35, ease: EASE, delay: i * 0.03 } }}
                      transition={{ duration: 0.8, ease: OUT, delay: 0.3 + i * 0.07 }}
                    >
                      {/* Stretched tall and narrow; the line box still fits the capitals, so nothing is clipped. */}
                      <span className="block [transform:scale(0.86,1.22)]">{item.label}</span>
                    </motion.a>
                  </li>
                ))}
              </ul>
            </nav>
            {(["topLeft", "topRight", "bottomLeft", "bottomRight"] as const).map((k, i) =>
              corners[k] ? (
                <motion.div
                  key={k}
                  className={cn(mono, "absolute max-w-[40%] leading-relaxed", k.startsWith("top") ? "top-5" : "bottom-5", k.endsWith("Left") ? "left-5 text-left" : "right-5 text-right", k.startsWith("top") && "hidden @3xl:block")}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.4, delay: 0.55 + i * 0.05 }}
                >
                  {corners[k]}
                </motion.div>
              ) : null,
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className={cn("relative flex", open ? "justify-center" : "justify-stretch")}>
        <motion.nav
          aria-label={label}
          layout
          transition={{ layout }}
          className={cn("flex h-14 items-center gap-6 overflow-hidden rounded-xl px-5 text-white backdrop-blur-xl", open ? "w-[min(100%,max(60%,20rem))] bg-black/15" : "w-full bg-[#15131c]/45 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-saturate-150")}
          style={{ borderRadius: 12 }}
        >
          <motion.a layout="position" transition={{ layout }} href={nameHref} className={cn(mono, "mr-auto rounded-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-white/70")}>
            {name}
          </motion.a>
          <AnimatePresence initial={false}>
            {open ? null : (
              <motion.ul key="links" className="hidden items-center gap-6 @2xl:flex" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.35 } }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
                {items.map((item) => (
                  <li key={item.label}>
                    <a href={item.href ?? item.items?.[0]?.href ?? "#"} className={cn(mono, "relative rounded-sm text-[13px] whitespace-nowrap text-white/85 outline-none after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:text-white hover:after:origin-left hover:after:scale-x-100 focus-visible:ring-2 focus-visible:ring-white/70")}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          <motion.button
            layout="position"
            transition={{ layout }}
            ref={toggle}
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-menu`}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => (open ? close() : setOpen(true))}
            className="group -mr-2 grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <svg viewBox="-8 -8 16 16" className="size-4 overflow-visible" aria-hidden="true">
              {dots.map(([x, y], i) => (
                <motion.rect
                  key={i}
                  width={3.6}
                  height={3.6}
                  x={-1.8}
                  y={-1.8}
                  rx={0.4}
                  fill="currentColor"
                  initial={false}
                  animate={open ? { x: x * 0.7, y: y * 0.7, rotate: 45 } : { x, y, rotate: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 24, delay: i * 0.02 }}
                  className="origin-center transition-[scale] group-hover:[scale:1.12]"
                />
              ))}
            </svg>
          </motion.button>
        </motion.nav>
      </div>
    </header>
  );
}
