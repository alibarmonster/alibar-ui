"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, overlayVariants } from "@/lib/motion";

export interface MorphingModalProps {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Called when the modal opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the modal, e.g. a button. */
  trigger?: ReactNode;
  /** Key of the current view. Changing it morphs the panel to the new view's height. @default "default" */
  view?: string;
  /** Heading of the current view; also the dialog's accessible name. */
  title: ReactNode;
  /** Supporting text under the title. */
  description?: ReactNode;
  /** Body of the current view. */
  children?: ReactNode;
  /** Show the close button in the corner. @default true */
  showClose?: boolean;
  /** Classes for the panel, e.g. a max width. */
  className?: string;
}

// The panel's height change and its scale-in share one spring.
const LAYOUT = { type: "spring", stiffness: 380, damping: 34 } as const;

export function MorphingModal({
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  view = "default",
  title,
  description,
  children,
  showClose = true,
  className,
}: MorphingModalProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const reduceMotion = useReducedMotion();
  const viewRef = useRef<HTMLDivElement>(null);
  const previousView = useRef(view);

  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  // When the view changes, the focused control has usually unmounted; move focus into the new view.
  useEffect(() => {
    if (previousView.current === view) return;
    previousView.current = view;
    const frame = requestAnimationFrame(() => {
      const target = viewRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? viewRef.current;
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [view]);

  const layout = reduceMotion ? { duration: 0 } : LAYOUT;

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <AnimatePresence>
        {isOpen ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-zinc-950/25 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.base }}
              />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Radix links the description automatically; only opt out when there is none. */}
              <Dialog.Content asChild forceMount {...(description ? {} : { "aria-describedby": undefined })}>
                <motion.div
                  layout
                  variants={overlayVariants(reduceMotion)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ layout }}
                  style={{ borderRadius: 20 }}
                  className={cn(
                    "pointer-events-auto relative w-full max-w-md overflow-hidden border border-border bg-popover text-popover-foreground shadow-xl outline-none",
                    className,
                  )}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={view}
                      ref={viewRef}
                      tabIndex={-1}
                      layout="position"
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, filter: "blur(6px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={
                        reduceMotion
                          ? { opacity: 0, transition: { duration: duration.instant } }
                          : { opacity: 0, scale: 0.98, filter: "blur(6px)", transition: { duration: duration.quick } }
                      }
                      transition={{ duration: duration.base, ease: ease.out, layout }}
                      className="p-6 outline-none"
                    >
                      <Dialog.Title className="pr-8 text-lg font-semibold tracking-tight text-foreground">{title}</Dialog.Title>
                      {description ? (
                        <Dialog.Description className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</Dialog.Description>
                      ) : null}
                      {children ? <div className="mt-5">{children}</div> : null}
                    </motion.div>
                  </AnimatePresence>
                  {showClose ? (
                    <Dialog.Close
                      aria-label="Close"
                      className="absolute top-3.5 right-3.5 inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Dialog.Close>
                  ) : null}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
