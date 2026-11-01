"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface ExpandableTabItem {
  /** Unique value for the tab. */
  value: string;
  /** Label shown while active; always used as the accessible name. */
  label: string;
  /** Icon shown at all times. */
  icon: ReactNode;
  /** Panel shown while the tab is active. Omit it to render only the bar. */
  content?: ReactNode;
}

export interface ExpandableTabsProps
  extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** The tabs, in order. */
  items: ExpandableTabItem[];
  /** Controlled active tab. */
  value?: string;
  /** Initially active tab when uncontrolled. @default the first tab */
  defaultValue?: string;
  /** Called with the newly active tab. */
  onValueChange?: (value: string) => void;
  /** Color of the bar. @default "light" */
  tone?: "light" | "dark";
}

const tones = {
  light: {
    bar: "border border-border bg-background shadow-sm",
    active: "bg-foreground",
    activeText: "text-background",
    idleText: "text-muted-foreground hover:text-foreground hover:bg-accent",
  },
  dark: {
    bar: "bg-foreground shadow-lg",
    active: "bg-background/15",
    activeText: "text-background",
    idleText: "text-background/60 hover:text-background",
  },
} as const;

// One spring for every layout change, so the tab, its label and the panel move together.
const LAYOUT = { type: "spring", stiffness: 420, damping: 36 } as const;

export function ExpandableTabs({
  items,
  value,
  defaultValue,
  onValueChange,
  tone = "light",
  className,
  "aria-label": ariaLabel,
  ...props
}: ExpandableTabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const active = value ?? internal;
  const reduceMotion = useReducedMotion();
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const t = tones[tone];
  const layout = reduceMotion ? { duration: 0 } : LAYOUT;
  const activeItem = items.find((item) => item.value === active);
  const tabId = (v: string) => `${id}-tab-${v}`;
  const panelId = (v: string) => `${id}-panel-${v}`;

  function select(next: string) {
    if (next === active) return;
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.value === active);
    const targets: Record<string, number> = {
      ArrowRight: (index + 1) % items.length,
      ArrowLeft: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    const next = targets[event.key];
    select(items[next].value);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <LayoutGroup id={id}>
        <div
          role="tablist"
          aria-label={ariaLabel}
          onKeyDown={onKeyDown}
          className={cn("inline-flex max-w-full items-center gap-1 rounded-full p-1", t.bar)}
        >
          {items.map((item, index) => {
            const isActive = item.value === active;
            return (
              <motion.button
                key={item.value}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                layout
                transition={layout}
                type="button"
                role="tab"
                id={tabId(item.value)}
                aria-label={item.label}
                aria-selected={isActive}
                aria-controls={isActive && item.content !== undefined ? panelId(item.value) : undefined}
                tabIndex={isActive ? 0 : -1}
                onClick={() => select(item.value)}
                style={{ borderRadius: 999 }}
                className={cn(
                  "relative flex h-9 shrink-0 cursor-pointer items-center gap-2 px-3 text-sm font-medium whitespace-nowrap outline-none",
                  "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive ? t.activeText : t.idleText,
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="active-pill"
                    aria-hidden="true"
                    transition={layout}
                    style={{ borderRadius: 999 }}
                    className={cn("absolute inset-0", t.active)}
                  />
                ) : null}
                <motion.span layout="position" transition={layout} className="relative flex [&_svg]:size-[18px]" aria-hidden="true">
                  {item.icon}
                </motion.span>
                <AnimatePresence mode="popLayout" initial={false}>
                  {isActive ? (
                    <motion.span
                      key="label"
                      layout="position"
                      aria-hidden="true"
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -6, filter: "blur(4px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, filter: reduceMotion ? "blur(0px)" : "blur(4px)", transition: { duration: duration.instant } }}
                      transition={{ duration: duration.base, ease: ease.out, layout }}
                      className="relative"
                    >
                      {item.label}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {activeItem?.content !== undefined ? (
          // The panel is a layout box: its height morphs (as a transform) while the content swaps inside it.
          <motion.div
            layout
            transition={layout}
            style={{ borderRadius: 16 }}
            className="relative mt-3 overflow-hidden border border-border bg-background shadow-sm"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={activeItem.value}
                layout="position"
                role="tabpanel"
                id={panelId(activeItem.value)}
                aria-labelledby={tabId(activeItem.value)}
                tabIndex={0}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: reduceMotion ? "blur(0px)" : "blur(4px)", transition: { duration: duration.quick } }}
                transition={{ duration: duration.base, ease: ease.out, layout }}
                className="p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                {activeItem.content}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        ) : null}
      </LayoutGroup>
    </div>
  );
}
