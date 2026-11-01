"use client";

import { useEffect, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue, type PanInfo } from "motion/react";
import { cn } from "@/lib/utils";

export interface SwipeAction {
  /** Stable identity. */
  id: string;
  /** Button label (also its accessible name). */
  label: string;
  /** Icon shown above the label. */
  icon: ReactNode;
  /** Color of the action. @default "neutral" */
  tone?: "neutral" | "success" | "destructive";
  /** Runs when the action is pressed or swiped all the way. */
  onAction: () => void;
}

export interface SwipeRowProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Row content. */
  children: ReactNode;
  /** Actions revealed by swiping right, outermost first. */
  leftActions?: SwipeAction[];
  /** Actions revealed by swiping left, outermost first. */
  rightActions?: SwipeAction[];
  /** Swiping past this fraction of the row runs the outermost action; false to disable. @default 0.6 */
  fullSwipe?: number | false;
  /** Width of each action button in px. @default 76 */
  actionWidth?: number;
}

const TONE = { neutral: "bg-zinc-500", success: "bg-success", destructive: "bg-destructive" } as const;
const SNAP = { type: "spring", stiffness: 420, damping: 38 } as const;

function ActionButton({
  action,
  side,
  index,
  width,
  x,
  reveal,
  onFocus,
  onRun,
}: {
  action: SwipeAction;
  side: "left" | "right";
  index: number;
  width: number;
  x: MotionValue<number>;
  reveal: number;
  onFocus: () => void;
  onRun: () => void;
}) {
  // Icons grow in as their slot is uncovered.
  const start = index * width;
  const scale = useTransform(x, (v) => {
    const shown = (side === "right" ? -v : v) - start;
    return 0.5 + 0.5 * Math.min(1, Math.max(0, shown / (width * reveal)));
  });
  return (
    <button
      type="button"
      onClick={onRun}
      onFocus={onFocus}
      className={cn("flex h-full shrink-0 cursor-pointer flex-col items-center justify-center gap-1 text-xs font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset", TONE[action.tone ?? "neutral"])}
      style={{ width }}
    >
      <motion.span aria-hidden="true" className="flex [&_svg]:size-5" style={{ scale }}>
        {action.icon}
      </motion.span>
      {action.label}
    </button>
  );
}

export function SwipeRow({
  children,
  leftActions = [],
  rightActions = [],
  fullSwipe = 0.6,
  actionWidth = 76,
  className,
  onKeyDown,
  onBlur,
  ...props
}: SwipeRowProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [open, setOpen] = useState<"left" | "right" | null>(null);
  const leftWidth = leftActions.length * actionWidth;
  const rightWidth = rightActions.length * actionWidth;
  const snap = reduceMotion ? { duration: 0 } : SNAP;

  // Links and images inside start the browser's own drag-and-drop, which would cancel the swipe.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const block = (event: DragEvent) => event.preventDefault();
    el.addEventListener("dragstart", block);
    return () => el.removeEventListener("dragstart", block);
  }, []);
  // Only the side being uncovered is shown (and clickable), so the two panels never overlap.
  const leftShown = useTransform(x, (v) => (v >= 0 ? 1 : 0));
  const rightShown = useTransform(x, (v) => (v < 0 ? 1 : 0));
  const leftEvents = useTransform(x, (v) => (v > 0 ? "auto" : "none"));
  const rightEvents = useTransform(x, (v) => (v < 0 ? "auto" : "none"));

  const settle = (side: "left" | "right" | null) => {
    setOpen(side);
    animate(x, side === "right" ? -rightWidth : side === "left" ? leftWidth : 0, snap);
  };

  const run = (action: SwipeAction, side: "left" | "right") => {
    const width = rootRef.current?.offsetWidth ?? 400;
    animate(x, side === "right" ? -width : width, reduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeIn" }).then(() => {
      action.onAction();
      x.set(0);
      setOpen(null);
    });
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const width = rootRef.current?.offsetWidth ?? 400;
    const offset = x.get();
    if (fullSwipe !== false && rightActions[0] && offset < -width * fullSwipe) return run(rightActions[0], "right");
    if (fullSwipe !== false && leftActions[0] && offset > width * fullSwipe) return run(leftActions[0], "left");
    const projected = offset + info.velocity.x * 0.15;
    if (rightWidth && projected < -rightWidth / 2) settle("right");
    else if (leftWidth && projected > leftWidth / 2) settle("left");
    else settle(null);
  };

  // Close when something outside the row is pressed.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) settle(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  });

  return (
    <div
      ref={rootRef}
      className={cn("relative overflow-hidden", className)}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.key === "Escape" && open) settle(null);
      }}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        onBlur?.(event);
        if (!event.currentTarget.contains(event.relatedTarget)) settle(null);
      }}
      {...props}
    >
      {/* Content comes first in the DOM so Tab goes from a row to its own actions; z-index keeps it on top. */}
      <motion.div
        className="relative z-10 bg-background touch-pan-y"
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: rightActions.length ? -9999 : 0, right: leftActions.length ? 9999 : 0 }}
        dragElastic={0.08}
        dragMomentum={false}
        onDragEnd={onDragEnd}
      >
        {children}
      </motion.div>
      {/* Actions sit behind the row; the outermost action's color fills any extra space on a long swipe. */}
      {leftActions.length ? (
        <motion.div className={cn("absolute inset-0 flex", TONE[leftActions[0].tone ?? "neutral"])} style={{ opacity: leftShown, pointerEvents: leftEvents }}>
          {leftActions.map((action, i) => (
            <ActionButton
              key={action.id}
              action={action}
              side="left"
              index={i}
              width={actionWidth}
              x={x}
              reveal={1}
              onFocus={() => settle("left")}
              onRun={() => run(action, "left")}
            />
          ))}
        </motion.div>
      ) : null}
      {rightActions.length ? (
        <motion.div className={cn("absolute inset-0 flex justify-end", TONE[rightActions[0].tone ?? "neutral"])} style={{ opacity: rightShown, pointerEvents: rightEvents }}>
          {[...rightActions].reverse().map((action, i) => (
            <ActionButton
              key={action.id}
              action={action}
              side="right"
              index={rightActions.length - 1 - i}
              width={actionWidth}
              x={x}
              reveal={1}
              onFocus={() => settle("right")}
              onRun={() => run(action, "right")}
            />
          ))}
        </motion.div>
      ) : null}
    </div>
  );
}
