"use client";

import { Fragment, useId, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/lib/nav/mobile-menu";
import type { NavAction, NavItem } from "@/lib/nav/types";

export interface GooeyNavProps {
  /** Short mark shown in the round badge, e.g. a letter or an icon. */
  brand: ReactNode;
  /** Where the badge links. @default "/" */
  brandHref?: string;
  /** Accessible name for the badge link. @default "Home" */
  brandLabel?: string;
  /** Links in the middle capsule. */
  items: NavItem[];
  /** The call to action in the last capsule. */
  cta?: NavAction;
  /** Dark capsules on light pages, or light capsules on dark ones. @default "dark" */
  tone?: "dark" | "light";
  /** Accessible name for the navigation. @default "Main" */
  label?: string;
  /** Classes for the header. */
  className?: string;
}

/**
 * Three capsules (a round badge, the links and a call to action) joined by liquid necks, as if
 * poured from one drop. The necks stretch while you hover a capsule, and an outline pill glides
 * between the links.
 */
export function GooeyNav({ brand, brandHref = "/", brandLabel = "Home", items, cta, tone = "dark", label = "Main", className }: GooeyNavProps) {
  const id = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const [stretch, setStretch] = useState<number | null>(null);
  const dark = tone === "dark";
  const ink = dark ? "#0a0a0a" : "#f5f5f4";
  const text = dark ? "text-white" : "text-[#0a0a0a]";
  const line = dark ? "border-white/35" : "border-black/25";
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 30 };

  /** The same row twice: once as filtered blobs, once as crisp content on top, so both line up. */
  const row = (blob: boolean) => {
    const gap = (i: number) => (
      <motion.span
        aria-hidden="true"
        className="relative flex shrink-0 items-center"
        initial={false}
        animate={{ width: stretch === i ? 24 : 14 }}
        transition={spring}
      >
        {blob ? <span className="h-5 w-[calc(100%+28px)] shrink-0 -translate-x-3.5 rounded-full" style={{ background: ink }} /> : null}
      </motion.span>
    );
    const shell = (neck: number, content: ReactNode, cls: string) => (
      <div className={cn("relative flex items-center rounded-full", cls)} style={blob ? { background: ink } : undefined} onPointerEnter={blob ? undefined : () => setStretch(neck)} onPointerLeave={blob ? undefined : () => setStretch(null)}>
        <div className={cn("contents", blob && "invisible")}>{content}</div>
      </div>
    );

    return (
      <div className="flex items-center" aria-hidden={blob || undefined}>
        {shell(
          0,
          <a href={brandHref} aria-label={brandLabel} tabIndex={blob ? -1 : undefined} className="grid size-[46px] place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#d4d4d8)] text-[17px] font-bold tracking-tight text-[#0a0a0a] shadow-[inset_0_-2px_4px_rgb(0_0_0/0.15)] outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {brand}
          </a>,
          "p-2",
        )}
        {gap(0)}
        {shell(
          1,
          <ul className={cn("flex h-12 items-center rounded-full border px-2", line)} onPointerLeave={() => setHover(null)}>
            {items.map((item, i) => (
              <Fragment key={item.label}>
                {i > 0 ? <li aria-hidden="true" className={cn("mx-0.5 h-4 w-px", dark ? "bg-white/30" : "bg-black/20")} /> : null}
                <li className="relative">
                  {!blob && hover === item.label ? <motion.span layoutId={`${id}-pill`} className={cn("absolute inset-y-1 inset-x-0 rounded-full border", line)} transition={spring} /> : null}
                  <a
                    href={item.href ?? item.items?.[0]?.href ?? "#"}
                    tabIndex={blob ? -1 : undefined}
                    onPointerEnter={() => setHover(item.label)}
                    onFocus={() => setHover(item.label)}
                    className={cn("relative flex h-10 items-center rounded-full px-3.5 text-[15px] font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring", text)}
                  >
                    {item.label}
                  </a>
                </li>
              </Fragment>
            ))}
          </ul>,
          "hidden p-2 @xl:flex",
        )}
        {cta ? (
          <>
            <span className="hidden @xl:contents">{gap(1)}</span>
            {shell(
              1,
              <a
                href={cta.href}
                tabIndex={blob ? -1 : undefined}
                className={cn("flex h-12 items-center rounded-full border px-5 text-[15px] font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", text, line, dark ? "hover:bg-white hover:text-[#0a0a0a]" : "hover:bg-[#0a0a0a] hover:text-white")}
              >
                {cta.label}
              </a>,
              "hidden p-2 @xl:flex",
            )}
          </>
        ) : null}
        <span className="contents @xl:hidden">
          {gap(3)}
          {shell(3, <div className="grid size-[46px] place-items-center">{blob ? null : <MobileMenu items={items} actions={cta ? [cta] : []} tone={dark ? "dark" : "light"} panelClassName="inset-x-auto left-1/2 w-64 -translate-x-1/2" />}</div>, "static p-2")}
        </span>
      </div>
    );
  };

  return (
    <header className={cn("@container sticky top-0 z-40 flex justify-center px-4 pt-4", className)}>
      <svg aria-hidden="true" className="absolute size-0">
        <filter id={`${id}-goo`}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
        </filter>
      </svg>
      <nav aria-label={label} className="relative">
        <div className="absolute inset-0" style={{ filter: `url(#${id}-goo)` }}>
          {row(true)}
        </div>
        <div className="relative">{row(false)}</div>
      </nav>
    </header>
  );
}
