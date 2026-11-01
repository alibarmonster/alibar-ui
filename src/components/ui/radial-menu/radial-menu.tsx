"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface RadialMenuItem {
  /** Unique id. */
  id: string;
  /** Accessible name, also shown as a label on hover and focus. */
  label: string;
  /** Icon for the item. */
  icon: ReactNode;
  /** Runs when the item is chosen; the menu then closes. */
  onSelect?: () => void;
}

export interface RadialMenuProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Items, placed along the arc in order. */
  items: RadialMenuItem[];
  /** Distance from the button's center to each item, in px. @default 88 */
  radius?: number;
  /** Arc start in degrees: 0 is right, 90 down, 180 left, 270 up. @default 180 */
  startAngle?: number;
  /** Arc end in degrees. A full 360° span spaces items evenly around the circle. @default 360 */
  endAngle?: number;
  /** Accessible name of the trigger. @default "Open menu" */
  label?: string;
  /** Trigger icon; it turns 45° when open, so a plus becomes a cross. @default <Plus /> */
  icon?: ReactNode;
}

const FAN = { type: "spring", stiffness: 420, damping: 24, mass: 0.8 } as const;

export function RadialMenu({
  items,
  radius = 88,
  startAngle = 180,
  endAngle = 360,
  label = "Open menu",
  icon,
  className,
  ...props
}: RadialMenuProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const returnFocus = useRef(false);
  const reduceMotion = useReducedMotion();

  // A full circle would put the first and last item on top of each other, so leave a gap.
  const span = endAngle - startAngle;
  const fullCircle = Math.abs(span) >= 360;
  const steps = fullCircle ? items.length : Math.max(items.length - 1, 1);
  const positions = items.map((_, i) => {
    const angle = ((startAngle + (span * i) / steps) * Math.PI) / 180;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle };
  });

  useEffect(() => {
    if (open) itemRefs.current[0]?.focus({ preventScroll: true });
    else if (returnFocus.current) {
      returnFocus.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

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

  function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const count = items.length;
    const moves: Record<string, number> = {
      ArrowRight: (active + 1) % count,
      ArrowDown: (active + 1) % count,
      ArrowLeft: (active - 1 + count) % count,
      ArrowUp: (active - 1 + count) % count,
      Home: 0,
      End: count - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]);
      itemRefs.current[moves[event.key]]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      close(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative inline-flex size-14 items-center justify-center", className)} {...props}>
      {/* A soft halo grows behind the items as the menu opens. */}
      <AnimatePresence>
        {open ? (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full bg-foreground/[0.04] ring-1 ring-border/60"
            style={{ width: radius * 2 + 64, height: radius * 2 + 64 }}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.2, transition: { duration: duration.quick } }}
            transition={{ duration: duration.base, ease: ease.out }}
          />
        ) : null}
      </AnimatePresence>

      {/* The role is only set while items exist, so there's never an empty menu in the tree. */}
      <div
        role={open ? "menu" : undefined}
        aria-label={open ? label : undefined}
        onKeyDown={onMenuKey}
        className="contents"
      >
        <AnimatePresence>
          {open
            ? items.map((item, i) => {
                const { x, y, angle } = positions[i];
                return (
                  <motion.button
                    key={item.id}
                    ref={(node) => {
                      itemRefs.current[i] = node;
                    }}
                    type="button"
                    role="menuitem"
                    tabIndex={i === active ? 0 : -1}
                    aria-label={item.label}
                    onFocus={() => setActive(i)}
                    onClick={() => {
                      item.onSelect?.();
                      close(true);
                    }}
                    initial={reduceMotion ? { opacity: 0, x, y } : { opacity: 0, x: 0, y: 0, scale: 0.3 }}
                    animate={{ opacity: 1, x, y, scale: 1 }}
                    exit={
                      reduceMotion
                        ? { opacity: 0, transition: { duration: duration.instant } }
                        : { opacity: 0, x: 0, y: 0, scale: 0.3, transition: { duration: duration.quick, ease: ease.out, delay: (items.length - 1 - i) * 0.015 } }
                    }
                    transition={reduceMotion ? { duration: duration.quick } : { ...FAN, delay: i * 0.035 }}
                    className="group/item absolute z-10 flex size-11 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-[18px]"
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {/* Label sits further out along the same ray, so it never covers the item. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute rounded-md bg-foreground px-2 py-0.5 text-xs font-medium whitespace-nowrap text-background opacity-0 shadow-md transition-opacity duration-150 group-hover/item:opacity-100 group-focus-visible/item:opacity-100"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `translate(-50%, -50%) translate(${Math.cos(angle) * 46}px, ${Math.sin(angle) * 40}px)`,
                      }}
                    >
                      {item.label}
                    </span>
                  </motion.button>
                );
              })
            : null}
        </AnimatePresence>
      </div>

      <motion.button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            close(false);
            return;
          }
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (open && event.key === "Escape") {
            event.preventDefault();
            close(true);
          }
        }}
        animate={{ scale: open && !reduceMotion ? 0.9 : 1 }}
        transition={FAN}
        className="relative z-20 flex size-14 cursor-pointer items-center justify-center rounded-full bg-foreground text-background shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <motion.span
          aria-hidden="true"
          className="flex [&_svg]:size-6"
          animate={{ rotate: open ? 45 : 0 }}
          transition={reduceMotion ? { duration: 0 } : FAN}
        >
          {icon ?? <Plus />}
        </motion.span>
      </motion.button>
    </div>
  );
}
