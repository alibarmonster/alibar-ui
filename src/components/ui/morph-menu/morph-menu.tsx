"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface MorphMenuItem {
  /** Visible label. */
  label: string;
  /** Icon before the label. */
  icon?: ReactNode;
  /** Shortcut hint at the end, e.g. "⌘N". */
  shortcut?: string;
  /** Style the item as destructive. */
  destructive?: boolean;
  /** Prevents choosing the item. */
  disabled?: boolean;
  /** Called when the item is chosen; the menu then closes. */
  onSelect?: () => void;
}

export interface MorphMenuProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Trigger content. Use an icon-only label together with aria-label. */
  label: ReactNode;
  /** Icon before the trigger label. */
  icon?: ReactNode;
  /** Menu items, in order. */
  items: MorphMenuItem[];
  /** Which edge the menu grows from. @default "start" */
  align?: "start" | "end";
  /** Surface color, shared by the button and the menu so the morph is seamless. @default "light" */
  tone?: "light" | "dark";
  /** Accessible name for the trigger and menu when the label is an icon. */
  "aria-label"?: string;
}

const tones = {
  light: {
    surface: "border border-border bg-popover text-popover-foreground shadow-lg",
    button: "border border-border bg-background text-foreground shadow-xs hover:bg-accent",
    item: "bg-accent",
    muted: "text-muted-foreground",
  },
  dark: {
    surface: "bg-foreground text-background shadow-xl",
    button: "bg-foreground text-background shadow-md hover:bg-foreground/90",
    item: "bg-background/12",
    muted: "text-background/55",
  },
} as const;

// Shared by the button↔menu morph so both directions feel the same.
const MORPH = { type: "spring", stiffness: 420, damping: 34, mass: 0.9 } as const;

export function MorphMenu({
  label,
  icon,
  items,
  align = "start",
  tone = "light",
  className,
  "aria-label": ariaLabel,
  ...props
}: MorphMenuProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const returnFocus = useRef(false);
  const reduceMotion = useReducedMotion();
  const groupId = useId();
  const menuId = useId();
  const t = tones[tone];
  const morph = reduceMotion ? { duration: 0 } : MORPH;
  const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);
  const firstEnabled = enabled[0] ?? 0;

  // The trigger unmounts while the menu is open, so focus is handed over by hand.
  useEffect(() => {
    if (open) {
      itemRefs.current[firstEnabled]?.focus({ preventScroll: true });
    } else if (returnFocus.current) {
      returnFocus.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [open, firstEnabled]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function close(focusTrigger: boolean) {
    returnFocus.current = focusTrigger;
    setOpen(false);
  }

  function openMenu() {
    setActive(firstEnabled);
    setOpen(true);
  }

  function focusItem(index: number) {
    setActive(index);
    itemRefs.current[index]?.focus({ preventScroll: true });
  }

  function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const position = enabled.indexOf(active);
    const moves: Record<string, number | undefined> = {
      ArrowDown: enabled[(position + 1) % enabled.length],
      ArrowUp: enabled[(position - 1 + enabled.length) % enabled.length],
      Home: enabled[0],
      End: enabled[enabled.length - 1],
    };
    if (event.key in moves) {
      event.preventDefault();
      const next = moves[event.key];
      if (next !== undefined) focusItem(next);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      close(false);
    }
  }

  const triggerContent = (
    <>
      {icon}
      {label}
    </>
  );

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)} {...props}>
      {/* Reserves the trigger's space while the menu is open. */}
      <span aria-hidden="true" className="invisible inline-flex h-10 items-center gap-2 px-4 text-sm font-medium [&_svg]:size-4">
        {triggerContent}
      </span>
      <LayoutGroup id={groupId}>
        {!open ? (
          <motion.button
            ref={triggerRef}
            layoutId="surface"
            transition={morph}
            type="button"
            aria-haspopup="menu"
            aria-expanded={false}
            aria-label={ariaLabel}
            onClick={openMenu}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                openMenu();
              }
            }}
            style={{ borderRadius: 20 }}
            className={cn(
              "absolute inset-0 z-10 inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden px-4 text-sm font-medium whitespace-nowrap outline-none",
              "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-4",
              t.button,
            )}
          >
            <motion.span
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: duration.quick, delay: reduceMotion ? 0 : 0.06 }}
              className="inline-flex items-center gap-2"
            >
              {triggerContent}
            </motion.span>
          </motion.button>
        ) : (
          <motion.div
            layoutId="surface"
            transition={morph}
            id={menuId}
            role="menu"
            aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
            aria-orientation="vertical"
            onKeyDown={onMenuKey}
            style={{ borderRadius: 14 }}
            className={cn("absolute top-0 z-50 w-56 overflow-hidden p-1", align === "end" ? "right-0" : "left-0", t.surface)}
          >
            {items.map((item, index) => (
              <motion.button
                key={item.label}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitem"
                tabIndex={index === active ? 0 : -1}
                aria-disabled={item.disabled || undefined}
                onPointerMove={() => !item.disabled && index !== active && focusItem(index)}
                onClick={() => {
                  if (item.disabled) return;
                  item.onSelect?.();
                  close(true);
                }}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: duration.quick, ease: ease.out, delay: reduceMotion ? 0 : 0.08 + index * 0.025 }}
                className={cn(
                  "relative flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left text-sm outline-none select-none [&_svg]:size-4 [&_svg]:shrink-0",
                  item.destructive && "text-destructive",
                  item.disabled && "cursor-not-allowed opacity-45",
                )}
              >
                {index === active && !item.disabled ? (
                  <motion.span
                    layoutId="item-highlight"
                    aria-hidden="true"
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
                    className={cn("absolute inset-0 rounded-md", item.destructive ? "bg-destructive/12" : t.item)}
                  />
                ) : null}
                {item.icon ? <span className={cn("relative flex", !item.destructive && t.muted)}>{item.icon}</span> : null}
                <span className="relative flex-1 truncate">{item.label}</span>
                {item.shortcut ? <kbd className={cn("relative font-sans text-xs tracking-widest", t.muted)}>{item.shortcut}</kbd> : null}
              </motion.button>
            ))}
          </motion.div>
        )}
      </LayoutGroup>
    </div>
  );
}
