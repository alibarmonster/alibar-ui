"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface ActionBarItem {
  /** Unique id. */
  id: string;
  /** Label revealed on hover and focus; always the accessible name. */
  label: string;
  /** Icon shown at all times. */
  icon: ReactNode;
  /** Runs when the action is chosen. */
  onClick?: () => void;
  /** Style the action as destructive. */
  destructive?: boolean;
  /** Prevents choosing the action. */
  disabled?: boolean;
}

export interface ActionBarProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Actions, in order. */
  items: ActionBarItem[];
  /** Bar color. @default "light" */
  tone?: "light" | "dark";
  /** Accessible name of the toolbar. @default "Actions" */
  "aria-label"?: string;
}

const tones = {
  light: {
    bar: "border border-border bg-background shadow-md",
    idle: "text-muted-foreground",
    open: "bg-accent text-foreground",
    danger: "bg-destructive/10 text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]",
  },
  dark: {
    bar: "bg-foreground shadow-lg",
    idle: "text-background/65",
    open: "bg-background/15 text-background",
    danger: "bg-destructive/25 text-[color-mix(in_oklab,var(--destructive)_45%,white)]",
  },
} as const;

const LAYOUT = { type: "spring", stiffness: 480, damping: 36 } as const;

export function ActionBar({ items, tone = "light", className, "aria-label": ariaLabel = "Actions", ...props }: ActionBarProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [tabStop, setTabStop] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const reduceMotion = useReducedMotion();
  const groupId = useId();
  const t = tones[tone];
  const layout = reduceMotion ? { duration: 0 } : LAYOUT;
  // Focus wins over hover, so keyboard users always see what they're on.
  const expanded = focused ?? hovered;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);
    const position = enabled.indexOf(tabStop);
    const moves: Record<string, number | undefined> = {
      ArrowRight: enabled[(position + 1) % enabled.length],
      ArrowLeft: enabled[(position - 1 + enabled.length) % enabled.length],
      Home: enabled[0],
      End: enabled[enabled.length - 1],
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = moves[event.key];
    if (next === undefined) return;
    setTabStop(next);
    buttons.current[next]?.focus();
  }

  return (
    <LayoutGroup id={groupId}>
      <motion.div
        layout
        transition={layout}
        role="toolbar"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        onPointerLeave={() => setHovered(null)}
        style={{ borderRadius: 999 }}
        className={cn("inline-flex items-center gap-1 p-1.5", t.bar, className)}
        {...props}
      >
        {items.map((item, index) => {
          const open = expanded === item.id && !item.disabled;
          return (
            <motion.button
              key={item.id}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              layout
              transition={layout}
              type="button"
              aria-label={item.label}
              aria-disabled={item.disabled || undefined}
              tabIndex={index === tabStop ? 0 : -1}
              onClick={() => !item.disabled && item.onClick?.()}
              onPointerEnter={() => setHovered(item.id)}
              onFocus={() => {
                setFocused(item.id);
                setTabStop(index);
              }}
              onBlur={() => setFocused(null)}
              style={{ borderRadius: 999 }}
              className={cn(
                "relative flex h-10 shrink-0 cursor-pointer items-center gap-2 px-3 text-sm font-medium whitespace-nowrap outline-none",
                "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-[18px] [&_svg]:shrink-0",
                item.disabled ? cn(t.idle, "cursor-not-allowed opacity-40") : open ? (item.destructive ? t.danger : t.open) : t.idle,
              )}
            >
              <motion.span layout="position" transition={layout} className="flex" aria-hidden="true">
                {item.icon}
              </motion.span>
              <AnimatePresence mode="popLayout" initial={false}>
                {open ? (
                  <motion.span
                    key="label"
                    layout="position"
                    aria-hidden="true"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -4, filter: "blur(3px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, transition: { duration: duration.instant } }}
                    transition={{ duration: duration.quick, ease: ease.out, layout }}
                  >
                    {item.label}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>
    </LayoutGroup>
  );
}
