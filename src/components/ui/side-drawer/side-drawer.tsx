"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "motion/react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/motion";

export interface SideDrawerProps {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Called when the drawer opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the drawer, e.g. a button. */
  trigger?: ReactNode;
  /** Edge the drawer slides in from. @default "right" */
  side?: "left" | "right";
  /** Drawer width. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Heading; also the dialog's accessible name. */
  title: ReactNode;
  /** Supporting text under the title. */
  description?: ReactNode;
  /** Scrollable body. */
  children?: ReactNode;
  /** Pinned content at the bottom, e.g. actions. */
  footer?: ReactNode;
  /** Classes for the drawer panel. */
  className?: string;
}

const widths = {
  sm: "w-[min(20rem,88vw)]",
  md: "w-[min(24rem,90vw)]",
  lg: "w-[min(32rem,92vw)]",
} as const;

const SLIDE = { type: "spring", stiffness: 380, damping: 38, mass: 0.9 } as const;

export function SideDrawer({
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  side = "right",
  size = "md",
  title,
  description,
  children,
  footer,
  className,
}: SideDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const hidden = side === "right" ? "100%" : "-100%";
  const direction = side === "right" ? 1 : -1;

  function onDragEnd(_: unknown, info: PanInfo) {
    // Swiping toward the drawer's own edge far or fast enough dismisses it.
    if (info.offset.x * direction > 90 || info.velocity.x * direction > 500) setOpen(false);
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <AnimatePresence>
        {isOpen ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-[3px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.base }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount {...(description ? {} : { "aria-describedby": undefined })}>
              <motion.div
                drag="x"
                dragListener={false}
                dragControls={dragControls}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={side === "right" ? { left: 0.05, right: 0.7 } : { left: 0.7, right: 0.05 }}
                onDragEnd={onDragEnd}
                initial={reduceMotion ? { opacity: 0 } : { x: hidden }}
                animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { x: hidden }}
                transition={reduceMotion ? { duration: duration.quick } : SLIDE}
                className={cn(
                  "fixed inset-y-0 z-50 flex flex-col bg-popover text-popover-foreground shadow-xl outline-none",
                  side === "right" ? "right-0 border-l border-border" : "left-0 border-r border-border",
                  widths[size],
                  className,
                )}
              >
                <div
                  onPointerDown={(event) => dragControls.start(event)}
                  className="flex shrink-0 touch-pan-y items-start justify-between gap-4 border-b border-border px-5 py-4"
                >
                  <div className="min-w-0">
                    <Dialog.Title className="text-base font-semibold tracking-tight text-foreground">{title}</Dialog.Title>
                    {description ? <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">{description}</Dialog.Description> : null}
                  </div>
                  <Dialog.Close
                    aria-label="Close"
                    className="-mt-1 -mr-2 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Dialog.Close>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
                {footer ? <div className="shrink-0 border-t border-border px-5 py-4">{footer}</div> : null}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
