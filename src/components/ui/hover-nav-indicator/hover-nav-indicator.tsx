"use client";

import { useId, useState, type ComponentProps, type ElementType, type MouseEvent, type ReactNode } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

export interface HoverNavItem {
  /** Link text. */
  label: string;
  /** Destination. */
  href: string;
  /** Icon before the label. */
  icon?: ReactNode;
}

export interface HoverNavIndicatorProps
  extends Omit<ComponentProps<"nav">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Links, in order. */
  items: HoverNavItem[];
  /** href of the current page; the indicator rests here. */
  activeHref?: string;
  /** Indicator style. @default "pill" */
  variant?: "pill" | "underline";
  /** Lay links out in a row or a column. @default "horizontal" */
  orientation?: "horizontal" | "vertical";
  /** Link component to render, e.g. Next.js Link. @default "a" */
  linkComponent?: ElementType;
  /** Called on click, e.g. to update activeHref or prevent default for client routing. */
  onNavigate?: (href: string, event: MouseEvent<HTMLElement>) => void;
}

export function HoverNavIndicator({
  items,
  activeHref,
  variant = "pill",
  orientation = "horizontal",
  linkComponent: Link = "a",
  onNavigate,
  className,
  "aria-label": ariaLabel = "Main",
  ...props
}: HoverNavIndicatorProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const groupId = useId();
  const vertical = orientation === "vertical";
  // The indicator follows focus, then hover, and rests on the current page.
  const target = focused ?? hovered ?? activeHref ?? null;

  return (
    <nav aria-label={ariaLabel} className={className} {...props}>
      <LayoutGroup id={groupId}>
        <ul
          onPointerLeave={() => setHovered(null)}
          className={cn("relative flex", vertical ? "w-full flex-col gap-0.5" : "flex-wrap items-center gap-1")}
        >
          {items.map((item) => {
            const isActive = item.href === activeHref;
            const isTarget = item.href === target;
            return (
              <li key={item.href} className={cn("relative", vertical && "w-full")}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onPointerEnter={() => setHovered(item.href)}
                  onFocus={() => setFocused(item.href)}
                  onBlur={() => setFocused(null)}
                  onClick={(event: MouseEvent<HTMLElement>) => onNavigate?.(item.href, event)}
                  className={cn(
                    "relative flex items-center gap-2 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-150",
                    "focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0",
                    vertical ? "h-9 w-full rounded-md px-3" : "h-9 rounded-md px-3",
                    isActive || isTarget ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {isTarget ? (
                    <motion.span
                      layoutId="indicator"
                      aria-hidden="true"
                      transition={reduceMotion ? { duration: 0 } : spring.snappy}
                      className={cn(
                        "absolute",
                        variant === "pill"
                          ? cn("inset-0 rounded-md", isActive ? "bg-accent" : "bg-accent/70")
                          : vertical
                            ? "inset-y-1.5 left-0 w-0.5 rounded-full bg-foreground"
                            : "inset-x-3 -bottom-1 h-0.5 rounded-full bg-foreground",
                      )}
                    />
                  ) : null}
                  <span className="relative flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
    </nav>
  );
}
