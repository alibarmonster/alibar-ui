"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface ExpandableCardProps
  extends Omit<ComponentProps<"button">, "children" | "title" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Card title; also the dialog's accessible name. */
  title: string;
  /** Short summary under the title, in both states. */
  description?: string;
  /** Visual at the top of the card, e.g. an image. Shown at 16:9 in both states. */
  media?: ReactNode;
  /** Detail content, revealed once the card expands. */
  children: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Called when the card expands or collapses. */
  onOpenChange?: (open: boolean) => void;
}

const MORPH = { type: "spring", stiffness: 330, damping: 32 } as const;

export function ExpandableCard({
  title,
  description,
  media,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  ...props
}: ExpandableCardProps) {
  const reduceMotion = useReducedMotion();
  const [internal, setInternal] = useState(defaultOpen);
  const isOpen = open ?? internal;
  const id = useId();
  const layout = reduceMotion ? { duration: 0 } : MORPH;

  const setOpen = (next: boolean) => {
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  };

  // Shared pieces carry the same layoutId in the card and the dialog, so each morphs into place.
  const mediaBlock = media ? (
    <motion.div layoutId={`${id}-media`} transition={layout} className="aspect-[16/9] overflow-hidden">
      {media}
    </motion.div>
  ) : null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn(
            "group relative block w-full cursor-pointer rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className,
          )}
          {...props}
        >
          {/* While open, an invisible copy keeps the card's space so the grid doesn't reflow. */}
          {isOpen ? (
            <div aria-hidden="true" className="invisible">
              {media ? <div className="aspect-[16/9]" /> : null}
              <div className="p-4">
                <p className="font-semibold">{title}</p>
                {description ? <p className="mt-1 text-sm">{description}</p> : null}
              </div>
            </div>
          ) : (
            <motion.div
              layoutId={`${id}-card`}
              transition={layout}
              style={{ borderRadius: 16 }}
              className="relative z-10 overflow-hidden border border-border bg-card text-card-foreground shadow-xs transition-shadow group-hover:shadow-md"
            >
              {mediaBlock}
              <div className="p-4">
                <motion.p layoutId={`${id}-title`} layout="position" transition={layout} className="font-semibold tracking-tight text-foreground">
                  {title}
                </motion.p>
                {description ? (
                  <motion.p layoutId={`${id}-description`} layout="position" transition={layout} className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </motion.p>
                ) : null}
              </div>
            </motion.div>
          )}
        </button>
      </Dialog.Trigger>

      <AnimatePresence>
        {isOpen ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-zinc-950/30 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.base }}
              />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <Dialog.Content asChild forceMount {...(description ? {} : { "aria-describedby": undefined })}>
                <motion.div
                  layoutId={`${id}-card`}
                  transition={layout}
                  style={{ borderRadius: 20 }}
                  className="pointer-events-auto relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto border border-border bg-popover text-popover-foreground shadow-xl outline-none"
                >
                  {mediaBlock}
                  <div className="p-6">
                    <Dialog.Title asChild>
                      <motion.h2 layoutId={`${id}-title`} layout="position" transition={layout} className="pr-8 text-xl font-semibold tracking-tight text-foreground">
                        {title}
                      </motion.h2>
                    </Dialog.Title>
                    {description ? (
                      <Dialog.Description asChild>
                        <motion.p layoutId={`${id}-description`} layout="position" transition={layout} className="mt-1 text-sm text-muted-foreground">
                          {description}
                        </motion.p>
                      </Dialog.Description>
                    ) : null}
                    {/* Detail content arrives once the card has mostly opened. */}
                    <motion.div
                      className="mt-5 text-sm leading-6 text-foreground"
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, transition: { duration: duration.instant } }}
                      transition={{ duration: duration.slow, ease: ease.out, delay: reduceMotion ? 0 : 0.12 }}
                    >
                      {children}
                    </motion.div>
                  </div>
                  <Dialog.Close
                    aria-label="Close"
                    className="absolute top-3 right-3 z-10 inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-xs backdrop-blur outline-none transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Dialog.Close>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
