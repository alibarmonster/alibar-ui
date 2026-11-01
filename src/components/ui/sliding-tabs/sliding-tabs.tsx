"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

export interface SlidingTabItem {
  /** Unique value for the tab. */
  value: string;
  /** Tab label. */
  label: ReactNode;
  /** Icon shown before the label. */
  icon?: ReactNode;
  /** Panel shown while the tab is active. Omit it to render only the tab bar. */
  content?: ReactNode;
  /** Prevents selecting the tab. */
  disabled?: boolean;
}

export interface SlidingTabsProps
  extends Omit<
    ComponentProps<"div">,
    "defaultValue" | "onChange" | "dir" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
  > {
  /** The tabs, in order. */
  items: SlidingTabItem[];
  /** Controlled active tab. */
  value?: string;
  /** Initially active tab when uncontrolled. @default the first tab */
  defaultValue?: string;
  /** Called with the newly active tab. */
  onValueChange?: (value: string) => void;
  /** Indicator style. @default "pill" */
  variant?: "pill" | "underline" | "segment";
  /** Classes for the tab bar. */
  listClassName?: string;
}

const listClasses = {
  pill: "gap-1",
  // The baseline is drawn inside the list so the scroll container can't clip the indicator over it.
  underline:
    "gap-1 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border after:content-['']",
  segment: "gap-0.5 rounded-[10px] bg-muted p-[3px]",
} as const;

const triggerClasses = {
  pill: "h-9 rounded-full px-4",
  underline: "h-10 rounded-md px-3",
  segment: "h-8 rounded-[7px] px-3.5",
} as const;

export function SlidingTabs({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = "pill",
  className,
  listClassName,
  "aria-label": ariaLabel,
  ...props
}: SlidingTabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const active = value ?? internal ?? "";
  const [hovered, setHovered] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const groupId = useId();

  // Panels slide in from the side of the newly chosen tab.
  const [previous, setPrevious] = useState(active);
  const [direction, setDirection] = useState(1);
  if (previous !== active) {
    const from = items.findIndex((i) => i.value === previous);
    const to = items.findIndex((i) => i.value === active);
    setDirection(to >= from ? 1 : -1);
    setPrevious(active);
  }

  const select = (next: string) => {
    if (next === active) return;
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  const indicatorTransition = reduceMotion ? { duration: 0 } : spring.snappy;
  const activeItem = items.find((item) => item.value === active);

  return (
    <TabsPrimitive.Root value={active} onValueChange={select} className={cn("w-full", className)} {...props}>
      <LayoutGroup id={groupId}>
        <TabsPrimitive.List
          aria-label={ariaLabel}
          onPointerLeave={() => setHovered(null)}
          className={cn("relative flex w-fit max-w-full items-center overflow-x-auto [scrollbar-width:none]", listClasses[variant], listClassName)}
        >
          {items.map((item) => {
            const isActive = item.value === active;
            return (
              <TabsPrimitive.Trigger
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                onPointerEnter={() => setHovered(item.value)}
                onMouseDown={(event) => {
                  // Radix focuses on mousedown, which Chrome can paint as a keyboard ring; select without focusing.
                  if (event.button !== 0 || event.ctrlKey || item.disabled) return;
                  event.preventDefault();
                  select(item.value);
                }}
                className={cn(
                  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 text-sm font-medium whitespace-nowrap outline-none select-none",
                  "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
                  "[&_svg]:size-4 [&_svg]:shrink-0",
                  triggerClasses[variant],
                  isActive
                    ? variant === "pill"
                      ? "text-background"
                      : "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {variant !== "segment" && hovered === item.value && !isActive ? (
                  <motion.span
                    layoutId="hover"
                    aria-hidden="true"
                    className={cn("absolute bg-accent", variant === "pill" ? "inset-0 rounded-full" : "inset-x-0 inset-y-1 rounded-md")}
                    transition={indicatorTransition}
                  />
                ) : null}
                {isActive ? (
                  <motion.span
                    layoutId="indicator"
                    aria-hidden="true"
                    transition={indicatorTransition}
                    className={cn(
                      "absolute",
                      variant === "pill" && "inset-0 rounded-full bg-foreground shadow-sm",
                      variant === "underline" && "inset-x-2 bottom-0 z-10 h-0.5 rounded-full bg-foreground",
                      variant === "segment" &&
                        "inset-0 rounded-[7px] bg-background shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_1px_2px_rgb(0_0_0/0.08),0_2px_6px_-2px_rgb(0_0_0/0.08)]",
                    )}
                  />
                ) : null}
                <span className="relative inline-flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>
      </LayoutGroup>

      {activeItem?.content !== undefined ? (
        <div className="relative mt-4 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <TabsPrimitive.Content key={activeItem.value} value={activeItem.value} forceMount asChild>
              <motion.div
                custom={direction}
                variants={{
                  enter: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 16, filter: "blur(4px)" }),
                  center: { opacity: 1, x: 0, filter: "blur(0px)" },
                  exit: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -16, filter: "blur(4px)" }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: duration.base, ease: ease.out }}
                className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {activeItem.content}
              </motion.div>
            </TabsPrimitive.Content>
          </AnimatePresence>
        </div>
      ) : null}
    </TabsPrimitive.Root>
  );
}
