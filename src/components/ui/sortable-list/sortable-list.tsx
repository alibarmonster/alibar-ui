"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { Reorder, motion, useDragControls, useReducedMotion } from "motion/react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SortableListProps<T>
  extends Omit<ComponentProps<"ul">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Items in their current order. */
  items: T[];
  /** Called with the new order while dragging or moving with the keyboard. */
  onReorder: (items: T[]) => void;
  /** Stable key for each item. */
  getKey: (item: T) => string;
  /** Short name for each item, used by the handle and announcements. */
  getLabel: (item: T) => string;
  /** Renders an item's content, beside its drag handle. */
  renderItem: (item: T) => ReactNode;
}

const LIFT = { type: "spring", stiffness: 500, damping: 34 } as const;

function Row<T>({
  item,
  label,
  grabbed,
  instructionsId,
  onHandleKeyDown,
  onHandleBlur,
  reduceMotion,
  children,
}: {
  item: T;
  label: string;
  grabbed: boolean;
  instructionsId: string;
  onHandleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onHandleBlur: () => void;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  const lifted = dragging || grabbed;

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      transition={reduceMotion ? { duration: 0 } : LIFT}
      className="relative"
      style={{ zIndex: lifted ? 2 : 0 }}
    >
      <motion.div
        className="relative flex items-center gap-2 rounded-xl border border-border bg-card py-2 pr-3 pl-1.5 text-card-foreground"
        animate={{ scale: lifted && !reduceMotion ? 1.02 : 1 }}
        transition={LIFT}
      >
        {/* The lifted shadow is its own layer, so only opacity animates. */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-lg"
          animate={{ opacity: lifted ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        />
        <button
          type="button"
          aria-label={`Reorder ${label}`}
          aria-describedby={instructionsId}
          aria-pressed={grabbed}
          onPointerDown={(event) => {
            event.preventDefault();
            controls.start(event);
          }}
          onKeyDown={onHandleKeyDown}
          onBlur={(event) => {
            // Moving the row can re-insert this button and blur it for a moment; React restores focus
            // right after, so only treat it as leaving if focus is still elsewhere a frame later.
            const handle = event.currentTarget;
            requestAnimationFrame(() => {
              if (document.activeElement !== handle) onHandleBlur();
            });
          }}
          className={cn(
            "relative flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
            grabbed && "bg-accent text-foreground",
          )}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <div className="relative min-w-0 flex-1">{children}</div>
      </motion.div>
    </Reorder.Item>
  );
}

export function SortableList<T>({
  items,
  onReorder,
  getKey,
  getLabel,
  renderItem,
  className,
  "aria-label": ariaLabel = "Sortable list",
  ...props
}: SortableListProps<T>) {
  const reduceMotion = useReducedMotion() ?? false;
  const [grabbed, setGrabbed] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const original = useRef<T[]>([]);
  const instructionsId = useId();

  const position = (list: T[], key: string) => list.findIndex((item) => getKey(item) === key) + 1;

  // Keyboard sorting: Space picks up, arrows move, Space drops, Escape puts it back.
  const onHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, item: T) => {
    const key = getKey(item);
    const label = getLabel(item);
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (grabbed === key) {
        setGrabbed(null);
        setAnnouncement(`${label} dropped at position ${position(items, key)} of ${items.length}.`);
      } else {
        original.current = items;
        setGrabbed(key);
        setAnnouncement(`${label} picked up, position ${position(items, key)} of ${items.length}. Use the up and down arrows to move it, Space to drop, Escape to cancel.`);
      }
      return;
    }
    if (grabbed !== key) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const from = position(items, key) - 1;
      const to = from + (event.key === "ArrowUp" ? -1 : 1);
      if (to < 0 || to >= items.length) return;
      const next = [...items];
      next.splice(to, 0, next.splice(from, 1)[0]);
      onReorder(next);
      setAnnouncement(`${label} moved to position ${to + 1} of ${items.length}.`);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onReorder(original.current);
      setGrabbed(null);
      setAnnouncement(`Reorder cancelled. ${label} is back at position ${position(original.current, key)}.`);
    }
  };

  return (
    <>
      <Reorder.Group as="ul" axis="y" values={items} onReorder={onReorder} aria-label={ariaLabel} className={cn("space-y-2", className)} {...props}>
        {items.map((item) => {
          const key = getKey(item);
          return (
            <Row
              key={key}
              item={item}
              label={getLabel(item)}
              grabbed={grabbed === key}
              instructionsId={instructionsId}
              onHandleKeyDown={(event) => onHandleKeyDown(event, item)}
              onHandleBlur={() => setGrabbed((g) => (g === key ? null : g))}
              reduceMotion={reduceMotion}
            >
              {renderItem(item)}
            </Row>
          );
        })}
      </Reorder.Group>
      <p id={instructionsId} className="sr-only">
        Drag the handle, or press Space to pick an item up, use the up and down arrows to move it, and press Space again to drop it.
      </p>
      <p aria-live="assertive" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
