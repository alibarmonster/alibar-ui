"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction } from "@/lib/nav/types";

export interface LiquidTab {
  label: string;
  href: string;
  /** Icon shown in the bubble when this tab is current. */
  icon: ReactNode;
}

export interface LiquidTabNavProps {
  /** Logo and name, on the left. */
  brand: ReactNode;
  /** Sections; the current one rises into the bubble. */
  tabs: LiquidTab[];
  /** Call to action on the right. */
  cta?: NavAction;
  /** Label of the current section. Uncontrolled when left out. */
  active?: string;
  /** Initial section when `active` is left out. @default the first tab */
  defaultActive?: string;
  /** Called with the label of the chosen tab. */
  onActiveChange?: (label: string) => void;
  /** Light bar with a dark bubble, or the reverse. @default "light" */
  tone?: "light" | "dark";
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

const H = 60;
const DIP = 26;
const HALF = 50;
const R = 20;

/** The bar's outline: rounded corners and a soft bump along the bottom edge centered on `cx` (flat when `depth` is 0). */
function barPath(w: number, cx: number, depth: number) {
  const x = Math.max(R + HALF, Math.min(w - R - HALF, cx));
  const y = H + depth;
  return [
    `M${R} 0H${w - R}Q${w} 0 ${w} ${R}V${H - R}Q${w} ${H} ${w - R} ${H}`,
    `H${x + HALF}C${x + 26} ${H} ${x + 30} ${y} ${x} ${y}C${x - 30} ${y} ${x - 26} ${H} ${x - HALF} ${H}`,
    `H${R}Q0 ${H} 0 ${H - R}V${R}Q0 0 ${R} 0Z`,
  ].join("");
}

/**
 * A website bar whose bottom edge swells into a soft bump under the current section. Pick another
 * tab and the bump flows over to it while the section's icon rises into a bubble inside it.
 */
export function LiquidTabNav({ brand, tabs, cta, active, defaultActive, onActiveChange, tone = "light", label = "Main", className }: LiquidTabNavProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const bar = useRef<HTMLDivElement>(null);
  const links = useRef(new Map<string, HTMLElement>());
  const [own, setOwn] = useState(defaultActive ?? tabs[0]?.label ?? "");
  const current = active ?? own;
  const [width, setWidth] = useState(0);
  const [centers, setCenters] = useState<Record<string, number>>({});
  const cx = useSpring(0, reduceMotion ? { duration: 0 } : { stiffness: 380, damping: 32 });
  const w = useMotionValue(0);
  const depth = useSpring(0, reduceMotion ? { duration: 0 } : { stiffness: 300, damping: 26 });
  const d = useTransform(() => barPath(w.get(), cx.get(), depth.get()));
  const dark = tone === "dark";

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      // Work in layout pixels, so a scaled ancestor (a zoomed preview) doesn't skew the shape.
      const width = el.offsetWidth;
      const scale = box.width / (width || 1) || 1;
      setWidth(width);
      w.set(width);
      const next: Record<string, number> = {};
      links.current.forEach((node, key) => {
        const r = node.getBoundingClientRect();
        // Hidden links (the narrow layout) have no box; the bar stays flat then.
        if (r.width) next[key] = (r.left - box.left + r.width / 2) / scale;
      });
      setCenters(next);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);

  // Follow the current tab; jump there on the first measurement instead of sliding in from 0.
  const placed = useRef(false);
  useEffect(() => {
    const x = centers[current];
    depth.set(x === undefined ? 0 : DIP);
    if (x === undefined) return;
    if (placed.current) cx.set(x);
    else {
      cx.jump(x);
      placed.current = true;
    }
  }, [centers, current, cx, depth]);

  const choose = (key: string) => {
    if (active === undefined) setOwn(key);
    onActiveChange?.(key);
  };
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 32 };

  return (
    <header className={cn("@container sticky top-0 z-40 px-4 pt-4", className)}>
      <nav aria-label={label} ref={bar} className="relative mx-auto max-w-5xl" style={{ height: H + DIP }}>
        <svg aria-hidden="true" className="absolute inset-x-0 top-0 overflow-visible drop-shadow-[0_8px_16px_rgb(0_0_0/0.08)]" width="100%" height={H + DIP}>
          {width ? <motion.path d={d} fill={dark ? "#0b0b0c" : "#ffffff"} stroke={dark ? "rgb(255 255 255/0.08)" : "rgb(0 0 0/0.05)"} /> : null}
        </svg>
        <div className="relative flex items-center gap-2 px-4" style={{ height: H }}>
          <div className="mr-2 shrink-0">{brand}</div>
          <ul className="hidden flex-1 items-center justify-center gap-1 @2xl:flex">
            {tabs.map((tab) => {
              const on = current === tab.label;
              return (
                <li key={tab.label}>
                  <a
                    ref={(el) => {
                      if (el) links.current.set(tab.label, el);
                      else links.current.delete(tab.label);
                    }}
                    href={tab.href}
                    aria-current={on ? "page" : undefined}
                    onClick={() => choose(tab.label)}
                    className={cn(
                      "relative flex h-11 min-w-[92px] flex-col items-center justify-center rounded-xl px-3 text-[13.5px] whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                      on ? (dark ? "font-semibold text-white" : "font-semibold text-[#0b0b0c]") : dark ? "text-white/55 hover:text-white" : "text-[#71717a] hover:text-[#0b0b0c]",
                    )}
                  >
                    <motion.span initial={false} animate={{ y: on ? -6 : 0 }} transition={spring}>
                      {tab.label}
                    </motion.span>
                    {on ? (
                      <motion.span
                        layoutId={`${id}-bubble`}
                        aria-hidden="true"
                        className={cn("absolute top-[calc(100%-4px)] left-1/2 grid size-8 -translate-x-1/2 place-items-center rounded-full shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)] [&_svg]:size-4", dark ? "bg-white text-[#0b0b0c]" : "bg-[#0b0b0c] text-white")}
                        transition={spring}
                      >
                        <motion.span key={tab.label} initial={reduceMotion ? false : { scale: 0.4, rotate: -30, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ delay: reduceMotion ? 0 : 0.08, ...spring }}>
                          {tab.icon}
                        </motion.span>
                      </motion.span>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>
          {cta ? (
            <a
              href={cta.href}
              className={cn(
                "ml-auto hidden h-10 shrink-0 items-center rounded-full px-5 text-[14px] font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 @2xl:flex",
                dark ? "bg-white text-[#0b0b0c] hover:bg-white/85" : "bg-[#0b0b0c] text-white hover:bg-[#27272a]",
              )}
            >
              {cta.label}
            </a>
          ) : null}
          <div className="ml-auto @2xl:hidden">
            <MobileMenu items={tabs} actions={cta ? [cta] : []} tone={tone} />
          </div>
        </div>
      </nav>
    </header>
  );
}
