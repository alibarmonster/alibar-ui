"use client";

import { useId, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction, NavItem } from "@/lib/nav/types";

export interface NotchNavProps {
  /** Mark shown in the center circle. */
  logo: ReactNode;
  /** Where the center circle links. @default "/" */
  logoHref?: string;
  /** Accessible name for the center link. @default "Home" */
  logoLabel?: string;
  /** Links left of the circle. */
  left: NavItem[];
  /** Links right of the circle. */
  right: NavItem[];
  /** Actions shown in the narrow menu. */
  actions?: NavAction[];
  /** Label of the current page; it gets the dot. Use "logo" for the circle. Uncontrolled when left out. */
  active?: string;
  /** Initial current page when `active` is left out. @default "logo" */
  defaultActive?: string;
  /** Called with the label of the link that was chosen. */
  onActiveChange?: (label: string) => void;
  /** Circle and dot color. @default "#2f8f62" */
  accent?: string;
  /** Bar color. @default "#ffffff" */
  surface?: string;
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

const BAR = 64;
const NOTCH = 150;
const DROP = 26;

/** The middle piece of the bar: straight on top, dipping into a smooth cradle for the circle below. */
function notchPath(w: number, h: number, d: number) {
  const c = w / 2;
  return `M0 0H${w}V${h}C${w - 26} ${h} ${c + 40} ${h} ${c + 34} ${h + d * 0.55}C${c + 26} ${h + d} ${c - 26} ${h + d} ${c - 34} ${h + d * 0.55}C${c - 40} ${h} 26 ${h} 0 ${h}Z`;
}

/**
 * A rounded bar with the logo in a raised circle at its center, sitting in a smooth notch that dips
 * below the bar. Links split to either side, and a small dot glides under the current page.
 */
export function NotchNav({
  logo,
  logoHref = "/",
  logoLabel = "Home",
  left,
  right,
  actions = [],
  active,
  defaultActive = "logo",
  onActiveChange,
  accent = "#2f8f62",
  surface = "#ffffff",
  label = "Main",
  className,
}: NotchNavProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [own, setOwn] = useState(defaultActive);
  const current = active ?? own;
  const choose = (key: string) => {
    if (active === undefined) setOwn(key);
    onActiveChange?.(key);
  };
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 520, damping: 34 };

  const dot = (key: string, place = "-bottom-1.5") =>
    current === key ? <motion.span layoutId={`${id}-dot`} aria-hidden="true" className={cn("absolute left-1/2 size-1.5 -translate-x-1/2 rounded-full", place)} style={{ background: accent }} transition={spring} /> : null;

  const side = (items: NavItem[], align: "start" | "end") => (
    <ul className={cn("hidden flex-1 items-center gap-1 px-4 @2xl:flex", align === "end" ? "justify-end" : "justify-start")}>
      {items.map((item) => (
        <li key={item.label} className="flex-1 text-center">
          <a
            href={item.href ?? item.items?.[0]?.href ?? "#"}
            aria-current={current === item.label ? "page" : undefined}
            onClick={() => choose(item.label)}
            className={cn(
              "relative inline-flex h-10 items-center rounded-full px-3 text-[14px] font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              current === item.label ? "text-[#18181b]" : "text-[#8a8a92] hover:text-[#3f3f46]",
            )}
          >
            {item.label}
            {dot(item.label)}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <header className={cn("@container sticky top-0 z-40 px-4 pt-4", className)}>
      <nav aria-label={label} className="relative mx-auto max-w-4xl" style={{ height: BAR + DROP }}>
        {/* One silhouette (two rounded halves and the notch) so the shadow follows the curve. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 flex drop-shadow-[0_10px_18px_rgb(0_0_0/0.08)]" style={{ color: surface }}>
          <span className="flex-1 rounded-l-[22px] bg-current" style={{ height: BAR }} />
          <svg width={NOTCH} height={BAR + DROP} viewBox={`0 0 ${NOTCH} ${BAR + DROP}`} className="-mx-px shrink-0">
            <path d={notchPath(NOTCH, BAR, DROP)} fill="currentColor" />
          </svg>
          <span className="flex-1 rounded-r-[22px] bg-current" style={{ height: BAR }} />
        </div>

        <div className="relative flex items-center" style={{ height: BAR }}>
          {side(left, "start")}
          <div className="flex flex-1 items-center pl-2 @2xl:hidden" />
          <div className="relative shrink-0" style={{ width: NOTCH }}>
            <a
              href={logoHref}
              aria-label={logoLabel}
              aria-current={current === "logo" ? "page" : undefined}
              onClick={() => choose("logo")}
              className="group absolute top-[18px] left-1/2 grid size-[64px] -translate-x-1/2 place-items-center rounded-full text-white shadow-[0_8px_20px_-8px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.25)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              style={{ background: accent }}
            >
              <span className="transition-transform duration-500 group-hover:rotate-[20deg] group-hover:scale-110 motion-reduce:transition-none [&_svg]:size-7">{logo}</span>
              {dot("logo", "-bottom-4")}
            </a>
          </div>
          {side(right, "end")}
          <div className="flex flex-1 justify-end pr-2 @2xl:hidden">
            <MobileMenu items={[...left, ...right]} actions={actions} panelClassName="top-[calc(100%+30px)]" />
          </div>
        </div>
      </nav>
    </header>
  );
}
