"use client";

import { useEffect, useImperativeHandle, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import { cn } from "@/lib/utils";

export type SwipeDirection = "left" | "right";

export interface SwipeCardsHandle {
  /** Swipe the top card away, e.g. from a button. */
  swipe: (direction: SwipeDirection) => void;
}

export interface SwipeCardsProps<T>
  extends Omit<ComponentProps<"div">, "children" | "ref" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Cards, top of the stack first. */
  items: T[];
  /** Stable key for each item. */
  getKey: (item: T) => string;
  /** Short name for each item, announced to screen readers. */
  getLabel: (item: T) => string;
  /** Renders a card's content. */
  renderCard: (item: T) => ReactNode;
  /** Called as a card is swiped away. */
  onSwipe?: (item: T, direction: SwipeDirection) => void;
  /** Stamps that fade in while dragging left or right. */
  labels?: { left?: ReactNode; right?: ReactNode };
  /** Drag distance in px that commits a swipe; a fast flick commits sooner. @default 110 */
  threshold?: number;
  /** Shown when every card has been swiped. */
  empty?: ReactNode;
  /** Imperative handle with swipe(direction). */
  ref?: Ref<SwipeCardsHandle>;
}

type Exit = { sign: number; distance: number; reduce: boolean };

const RETURN = { type: "spring", stiffness: 420, damping: 30 } as const;
const STACK = { type: "spring", stiffness: 300, damping: 28 } as const;

function Card({
  pos,
  threshold,
  labels,
  reduceMotion,
  onCommit,
  children,
}: {
  pos: number;
  threshold: number;
  labels?: { left?: ReactNode; right?: ReactNode };
  reduceMotion: boolean;
  onCommit: (direction: SwipeDirection) => void;
  children: ReactNode;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-320, 0, 320], reduceMotion ? [0, 0, 0] : [-16, 0, 16]);
  const leftStamp = useTransform(x, [-threshold, -24], [1, 0]);
  const rightStamp = useTransform(x, [24, threshold], [0, 1]);
  const isTop = pos === 0;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const committed = Math.abs(info.offset.x) > threshold || (Math.abs(info.velocity.x) > 650 && Math.abs(info.offset.x) > 24);
    if (committed) onCommit(info.offset.x > 0 ? "right" : "left");
    else animate(x, 0, RETURN);
  };

  return (
    <motion.div
      aria-hidden={!isTop || undefined}
      className={cn("absolute inset-0", isTop ? "cursor-grab touch-pan-y active:cursor-grabbing" : "pointer-events-none")}
      style={{ x, rotate, zIndex: 10 - pos }}
      drag={isTop ? "x" : false}
      dragElastic={0.9}
      dragMomentum={false}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.9, y: 24, opacity: 0 }}
      animate={{ scale: 1 - pos * 0.05, y: pos * 12, opacity: 1 }}
      // Flung off with the drag's own velocity (springs inherit it), rotating as it goes.
      exit="exit"
      variants={{
        exit: ({ sign, distance, reduce }: Exit) =>
          // zIndex lifts the leaving card above the one taking its place.
          reduce
            ? { x: sign * 40, opacity: 0, zIndex: 20, transition: { duration: 0.15 } }
            : { x: sign * distance, rotate: sign * 22, zIndex: 20, transition: { type: "spring", stiffness: 200, damping: 30 } },
      }}
      transition={STACK}
    >
      {children}
      {isTop && labels?.left ? (
        <motion.div aria-hidden="true" className="pointer-events-none absolute top-5 right-5 -rotate-12" style={{ opacity: leftStamp }}>
          {labels.left}
        </motion.div>
      ) : null}
      {isTop && labels?.right ? (
        <motion.div aria-hidden="true" className="pointer-events-none absolute top-5 left-5 rotate-12" style={{ opacity: rightStamp }}>
          {labels.right}
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export function SwipeCards<T>({
  items,
  getKey,
  getLabel,
  renderCard,
  onSwipe,
  labels,
  threshold = 110,
  empty,
  ref,
  className,
  "aria-label": ariaLabel = "Card stack",
  ...props
}: SwipeCardsProps<T>) {
  const reduceMotion = useReducedMotion() ?? false;
  const [gone, setGone] = useState<string[]>([]);
  const [exit, setExit] = useState<Exit>({ sign: 1, distance: 480, reduce: false });
  const [announcement, setAnnouncement] = useState("");
  const stackRef = useRef<HTMLDivElement>(null);

  // Links and images inside start the browser's own drag-and-drop, which would cancel the swipe.
  useEffect(() => {
    const el = stackRef.current;
    if (!el) return;
    const block = (event: DragEvent) => event.preventDefault();
    el.addEventListener("dragstart", block);
    return () => el.removeEventListener("dragstart", block);
  }, []);

  const remaining = items.filter((item) => !gone.includes(getKey(item)));
  const top = remaining[0];

  const commit = (direction: SwipeDirection) => {
    if (!top) return;
    const width = stackRef.current?.offsetWidth ?? 320;
    setExit({ sign: direction === "right" ? 1 : -1, distance: width + 200, reduce: reduceMotion });
    setGone((g) => [...g, getKey(top)]);
    setAnnouncement(`${direction === "right" ? "Kept" : "Passed"} ${getLabel(top)}. ${remaining.length - 1} left.`);
    onSwipe?.(top, direction);
  };

  useImperativeHandle(ref, () => ({ swipe: commit }));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") commit("left");
    else if (event.key === "ArrowRight") commit("right");
    else return;
    event.preventDefault();
  };

  return (
    <div
      ref={stackRef}
      tabIndex={top ? 0 : -1}
      role="group"
      aria-roledescription="card stack"
      aria-label={top ? `${ariaLabel}: ${getLabel(top)}, ${remaining.length} left. Use the left and right arrow keys to swipe.` : ariaLabel}
      onKeyDown={onKeyDown}
      className={cn("relative rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4", className)}
      {...props}
    >
      {!top && empty ? <div className="absolute inset-0 flex items-center justify-center">{empty}</div> : null}
      <AnimatePresence initial={false} custom={exit}>
        {remaining.slice(0, 3).map((item, pos) => (
          <Card key={getKey(item)} pos={pos} threshold={threshold} labels={labels} reduceMotion={reduceMotion} onCommit={commit}>
            {renderCard(item)}
          </Card>
        ))}
      </AnimatePresence>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
