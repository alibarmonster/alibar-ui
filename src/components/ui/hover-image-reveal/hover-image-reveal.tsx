"use client";

import { useRef, useState, type ComponentProps, type ElementType, type FocusEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface RevealItem {
  /** Stable identity. */
  id: string;
  /** Row title. */
  title: string;
  /** Secondary text on the right, e.g. a year. */
  meta?: string;
  /** Destination. */
  href: string;
  /** Preview that appears beside the cursor, e.g. an image. */
  image: ReactNode;
}

export interface HoverImageRevealProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Rows, in order. */
  items: RevealItem[];
  /** Preview width in px. @default 220 */
  imageWidth?: number;
  /** Preview height in px. @default 280 */
  imageHeight?: number;
  /** Link component, e.g. Next.js Link. @default "a" */
  linkComponent?: ElementType;
  /** Called when a row is clicked. */
  onNavigate?: (item: RevealItem, event: MouseEvent<HTMLElement>) => void;
}

const FOLLOW = { stiffness: 260, damping: 26, mass: 0.6 };

export function HoverImageReveal({
  items,
  imageWidth = 220,
  imageHeight = 280,
  linkComponent: Link = "a",
  onNavigate,
  className,
  ...props
}: HoverImageRevealProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const sx = useSpring(tx, FOLLOW);
  const sy = useSpring(ty, FOLLOW);
  const x = reduceMotion ? tx : sx;
  const y = reduceMotion ? ty : sy;
  // The preview leans into the direction it's travelling.
  const velocity = useVelocity(sx);
  const rotate = useSpring(useTransform(velocity, (v) => (reduceMotion ? 0 : Math.max(-10, Math.min(10, v / 90)))), { stiffness: 220, damping: 22 });

  // Beside the cursor (right of it, flipping left near the edge), vertically centered on it.
  const place = (px: number, py: number, jump: boolean) => {
    const width = rootRef.current?.offsetWidth ?? 0;
    const left = px + 28 + imageWidth > width ? px - 28 - imageWidth : px + 28;
    const top = py - imageHeight / 2;
    if (jump) {
      tx.jump(left);
      ty.jump(top);
      sx.jump(left);
      sy.jump(top);
    } else {
      tx.set(left);
      ty.set(top);
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    place(event.clientX - rect.left, event.clientY - rect.top, active === null);
  };

  const current = items.find((item) => item.id === active);

  return (
    <div ref={rootRef} className={cn("relative", className)} onPointerMove={onPointerMove} onPointerLeave={() => setActive(null)} {...props}>
      <ul className="divide-y divide-border border-y border-border">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              onClick={(event: MouseEvent<HTMLElement>) => onNavigate?.(item, event)}
              onPointerEnter={(event: PointerEvent<HTMLElement>) => event.pointerType === "mouse" && setActive(item.id)}
              onFocus={(event: FocusEvent<HTMLElement>) => {
                if (!event.currentTarget.matches(":focus-visible")) return;
                // Keyboard focus anchors the preview near the end of the focused row.
                const root = rootRef.current?.getBoundingClientRect();
                const row = event.currentTarget.getBoundingClientRect();
                if (root) place(row.right - root.left - imageWidth - 120, row.top - root.top + row.height / 2, true);
                setActive(item.id);
              }}
              onBlur={() => setActive(null)}
              className={cn(
                "group flex items-baseline justify-between gap-6 py-5 outline-none transition-opacity duration-200 focus-visible:ring-2 focus-visible:ring-ring",
                active !== null && active !== item.id && "opacity-40",
              )}
            >
              <span className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{item.title}</span>
              {item.meta ? <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{item.meta}</span> : null}
            </Link>
          </li>
        ))}
      </ul>

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-10 overflow-hidden rounded-xl shadow-xl"
        style={{ width: imageWidth, height: imageHeight, x, y, rotate }}
        initial={false}
        animate={current ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduceMotion ? 1 : 0.85 }}
        transition={{ duration: duration.base, ease: ease.out }}
      >
        <AnimatePresence initial={false}>
          {current ? (
            // Each new preview wipes up from the bottom over the previous one.
            <motion.div
              key={current.id}
              className="absolute inset-0"
              initial={reduceMotion ? { opacity: 0 } : { clipPath: "inset(100% 0% 0% 0%)", scale: 1.12 }}
              animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1, opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: duration.quick, delay: 0.2 } }}
              transition={{ duration: duration.slow, ease: ease.out }}
            >
              {current.image}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
