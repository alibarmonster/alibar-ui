"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

export interface LogoGridItem {
  /** Company name; the cell is announced as "Learn more about {name}". */
  name: string;
  /** Monochrome logo, sized by font-size (about 24–28px tall at the default size). */
  logo: ReactNode;
  /** Where the cell links to. */
  href: string;
}

export interface LogoGridProps extends Omit<ComponentProps<"section">, "children"> {
  /** Logos to show, each linking somewhere. */
  items: LogoGridItem[];
  /** Small line centered above the grid, e.g. "Trusted by fast-growing startups". */
  eyebrow?: string;
  /** Text of the revealed link. @default "Learn More" */
  linkLabel?: string;
  /** Columns on wider containers (2 below a 34rem container). @default 4 */
  columns?: 2 | 3 | 4 | 5;
  /** "grid": hairline grid (default). "plain": no lines, more air. "fill": a white highlight glides between cells. @default "grid" */
  variant?: "grid" | "plain" | "fill";
}

const COLUMNS = {
  2: "@[34rem]:grid-cols-2",
  3: "@[34rem]:grid-cols-3",
  4: "@[34rem]:grid-cols-4",
  5: "@[34rem]:grid-cols-5",
} as const;

export function LogoGrid({ items, eyebrow, linkLabel = "Learn More", columns = 4, variant = "grid", className, ...props }: LogoGridProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  // Filler cells complete the last row at each breakpoint, so the hairlines never show a gap.
  const mobileFill = (2 - (items.length % 2)) % 2;
  const wideFill = (columns - (items.length % columns)) % columns;
  const fillers = Math.max(mobileFill, wideFill);

  return (
    <section className={cn("@container w-full bg-surface py-12", className)} {...props}>
      {eyebrow ? <p className="mb-8 px-4 text-center text-sm text-muted-foreground">{eyebrow}</p> : null}
      <LayoutGroup id={id}>
        <ul
          onPointerLeave={() => setActive(null)}
          className={cn(
            "grid grid-cols-2",
            COLUMNS[columns],
            variant === "grid" && "gap-px border-y border-border bg-border",
            variant === "plain" && "gap-x-4 gap-y-6 px-4",
            variant === "fill" && "gap-2 px-3",
          )}
        >
          {items.map((item, index) => (
            <li key={item.name} className={cn(variant === "grid" && "bg-surface")}>
              <a
                href={item.href}
                onPointerEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                className={cn(
                  "group relative flex h-[108px] items-center justify-center overflow-hidden outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  variant === "plain" && "h-[120px] rounded-xl",
                  variant === "fill" && "rounded-2xl",
                )}
              >
                {variant === "fill" ? (
                  <AnimatePresence>
                    {active === index ? (
                      <motion.span
                        layoutId="logo-grid-fill"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-2xl bg-background shadow-sm ring-1 ring-border"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        transition={reduceMotion ? { duration: 0 } : { ...spring.smooth, opacity: { duration: 0.15 } }}
                      />
                    ) : null}
                  </AnimatePresence>
                ) : null}
                <span className="sr-only">Learn more about {item.name}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative text-[22px] text-foreground transition-transform duration-200 ease-out [&>img]:h-7 [&>img]:w-auto [&>svg]:h-7 [&>svg]:w-auto",
                    // Enter springs up with a slight overshoot; leaving is a quicker ease-out.
                    "group-hover:-translate-y-2.5 group-hover:duration-500 group-hover:ease-[cubic-bezier(0.34,1.4,0.64,1)]",
                    "group-focus-visible:-translate-y-2.5 group-focus-visible:duration-500 group-focus-visible:ease-[cubic-bezier(0.34,1.4,0.64,1)]",
                    "[@media(hover:none)]:-translate-y-2.5 motion-reduce:!translate-y-0 motion-reduce:transition-none",
                  )}
                >
                  {item.logo}
                </span>
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[18px] flex justify-center">
                  <span
                    className={cn(
                      "flex translate-y-1.5 items-center gap-1 text-[13px] font-medium text-foreground opacity-0 blur-[4px]",
                      "transition-[opacity,transform,filter] duration-150 ease-out",
                      "group-hover:translate-y-0 group-hover:opacity-100 group-hover:blur-none group-hover:duration-300",
                      "group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:blur-none group-focus-visible:duration-300",
                      "[@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100 [@media(hover:none)]:blur-none",
                      "motion-reduce:translate-y-0 motion-reduce:blur-none",
                    )}
                  >
                    {linkLabel}
                    <ArrowRight
                      className={cn(
                        "size-3.5 transition-transform duration-150 ease-out",
                        "group-hover:translate-x-0.5 group-hover:delay-200 group-hover:duration-300",
                        "group-focus-visible:translate-x-0.5 group-focus-visible:delay-200 group-focus-visible:duration-300",
                        "motion-reduce:!translate-x-0",
                      )}
                    />
                  </span>
                </span>
              </a>
            </li>
          ))}
          {Array.from({ length: fillers }, (_, i) => (
            <li
              key={`filler-${i}`}
              aria-hidden="true"
              className={cn(variant === "grid" && "bg-surface", i < mobileFill ? "block" : "hidden", i < wideFill ? "@[34rem]:block" : "@[34rem]:hidden")}
            />
          ))}
        </ul>
      </LayoutGroup>
    </section>
  );
}
