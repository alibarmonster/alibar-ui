"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "motion/react";
import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";

export interface BottomSheetProps {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Called when the sheet opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the sheet, e.g. a button. */
  trigger?: ReactNode;
  /** Heading; also the dialog's accessible name. */
  title: ReactNode;
  /** Supporting text under the title. */
  description?: ReactNode;
  /** Visible heights as fractions of the viewport, smallest first. @default [0.5, 0.92] */
  snapPoints?: number[];
  /** Index of the snap point to open at. @default 0 */
  defaultSnap?: number;
  /** Sheet content; it scrolls when taller than the visible area. */
  children?: ReactNode;
  /** Classes for the sheet surface. */
  className?: string;
}

const SNAP_SPRING = { type: "spring", stiffness: 420, damping: 40, mass: 0.9 } as const;

function subscribeResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}
const readViewport = () => window.innerHeight;

export function BottomSheet({
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  title,
  description,
  snapPoints = [0.5, 0.92],
  defaultSnap = 0,
  children,
  className,
}: BottomSheetProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <AnimatePresence>
        {isOpen ? (
          <Sheet
            key="sheet"
            title={title}
            description={description}
            snapPoints={snapPoints}
            defaultSnap={defaultSnap}
            className={className}
            onClose={() => setOpen(false)}
          >
            {children}
          </Sheet>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Sheet({
  title,
  description,
  snapPoints,
  defaultSnap,
  className,
  onClose,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  snapPoints: number[];
  defaultSnap: number;
  className?: string;
  onClose: () => void;
  children?: ReactNode;
}) {
  const viewport = useSyncExternalStore(subscribeResize, readViewport, () => 800);
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const [snap, setSnap] = useState(Math.min(defaultSnap, snapPoints.length - 1));

  // The sheet is as tall as the highest snap point; lower snaps push it partly below the fold.
  const sheetHeight = Math.max(...snapPoints) * viewport;
  const offsetFor = (index: number) => sheetHeight - snapPoints[index] * viewport;
  const y = useMotionValue(sheetHeight);
  const backdrop = useTransform(y, [offsetFor(0), sheetHeight], [1, 0]);
  const settle = reduceMotion ? { duration: 0 } : SNAP_SPRING;

  const snapFraction = snapPoints[snap];
  useEffect(() => {
    animate(y, sheetHeight - snapFraction * viewport, reduceMotion ? { duration: 0 } : SNAP_SPRING);
  }, [snapFraction, sheetHeight, viewport, reduceMotion, y]);

  function onDragEnd(_: unknown, info: PanInfo) {
    // Project where a flick would land, then settle on the nearest snap point (or close).
    const projected = y.get() + info.velocity.y * 0.2;
    const closeAt = offsetFor(0) + snapPoints[0] * viewport * 0.45;
    if (projected > closeAt) {
      onClose();
      return;
    }
    const nearest = snapPoints.reduce(
      (best, _, i) => (Math.abs(offsetFor(i) - projected) < Math.abs(offsetFor(best) - projected) ? i : best),
      0,
    );
    setSnap(nearest);
    animate(y, offsetFor(nearest), settle);
  }

  return (
    <Dialog.Portal forceMount>
      <Dialog.Overlay asChild forceMount>
        {/* Outer layer fades with presence; the inner one tracks the drag position. */}
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-zinc-950/30" style={{ opacity: backdrop }} />
        </motion.div>
      </Dialog.Overlay>
      <Dialog.Content asChild forceMount {...(description ? {} : { "aria-describedby": undefined })}>
        <motion.div
          drag="y"
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: sheetHeight }}
          dragElastic={{ top: 0.04, bottom: 0.25 }}
          dragMomentum={false}
          onDragEnd={onDragEnd}
          style={{ y, height: sheetHeight }}
          exit={{ y: sheetHeight, transition: reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 40 } }}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-lg flex-col rounded-t-[20px] border border-b-0 border-border bg-popover text-popover-foreground shadow-[0_-8px_40px_rgb(0_0_0/0.12)] outline-none",
            className,
          )}
        >
          <div
            onPointerDown={(event) => dragControls.start(event)}
            className="shrink-0 cursor-grab touch-none px-5 pt-2.5 pb-3 active:cursor-grabbing"
          >
            <button
              type="button"
              aria-label={snap < snapPoints.length - 1 ? "Expand sheet" : "Collapse sheet"}
              onClick={() => setSnap((s) => (s + 1) % snapPoints.length)}
              className="mx-auto flex h-5 w-16 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
            </button>
            <Dialog.Title className="mt-2 text-base font-semibold tracking-tight text-foreground">{title}</Dialog.Title>
            {description ? <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">{description}</Dialog.Description> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </motion.div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
