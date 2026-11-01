"use client";

import { useState, type ComponentProps, type FocusEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface StackedCard {
  /** Stable identity. */
  id: string;
  /** Card content. */
  content: ReactNode;
  /** Short name, used for the "bring to front" button. */
  label?: string;
}

export interface StackedCardsProps
  extends Omit<ComponentProps<"ul">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Cards, top of the stack first. */
  items: StackedCard[];
  /** How the stack opens on hover or focus: a hand of cards, or a horizontal spread. @default "fan" */
  variant?: "fan" | "spread";
  /** Cards visible behind the top one. @default 3 */
  depth?: number;
  /** Clicking a card behind the top brings it to the front. @default true */
  bringToFront?: boolean;
  /** Called with the new order (ids, top first) after a card is brought to the front. */
  onOrderChange?: (ids: string[]) => void;
}

const SPRING = { type: "spring", stiffness: 300, damping: 26 } as const;

export function StackedCards({
  items,
  variant = "fan",
  depth = 3,
  bringToFront = true,
  onOrderChange,
  className,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: StackedCardsProps) {
  const reduceMotion = useReducedMotion();
  const [order, setOrder] = useState(() => items.map((item) => item.id));
  const [open, setOpen] = useState(false);
  // Keep the order in step with the items: drop removed ids, append new ones at the back.
  const ids = [...order.filter((id) => items.some((item) => item.id === id)), ...items.filter((item) => !order.includes(item.id)).map((item) => item.id)];
  const visible = Math.min(ids.length, depth + 1);

  const raise = (id: string) => {
    const next = [id, ...ids.filter((other) => other !== id)];
    setOrder(next);
    onOrderChange?.(next);
  };

  const pose = (pos: number) => {
    if (pos >= visible) return { x: 0, y: -depth * 10, scale: 1 - depth * 0.05, rotate: 0, opacity: 0 };
    if (!open || reduceMotion) return { x: 0, y: -pos * 10, scale: 1 - pos * 0.05, rotate: 0, opacity: 1 };
    if (variant === "spread") return { x: `${-pos * 40}%`, y: 0, scale: 1 - pos * 0.04, rotate: 0, opacity: 1 };
    // A hand of cards: the top card leans right at the front, the rest fan out to the left.
    const angle = ((visible - 1) / 2 - pos) * 7;
    return { x: angle * 5, y: Math.abs(angle) * 0.8, scale: 1, rotate: angle, opacity: 1 };
  };

  return (
    <ul
      className={cn("grid *:[grid-area:1/1]", className)}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        setOpen(false);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        setOpen(true);
      }}
      onBlur={(event: FocusEvent<HTMLUListElement>) => {
        onBlur?.(event);
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      {...props}
    >
      {ids.map((id, pos) => {
        const item = items.find((candidate) => candidate.id === id)!;
        return (
          <motion.li
            key={id}
            className="relative origin-bottom"
            style={{ zIndex: ids.length - pos }}
            initial={false}
            animate={pose(pos)}
            transition={SPRING}
            aria-hidden={pos >= visible || undefined}
          >
            {item.content}
            {bringToFront && pos > 0 && pos < visible ? (
              <button
                type="button"
                onClick={() => raise(id)}
                aria-label={`Bring ${item.label ?? "card"} to the front`}
                className="absolute inset-0 cursor-pointer rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : null}
          </motion.li>
        );
      })}
    </ul>
  );
}
