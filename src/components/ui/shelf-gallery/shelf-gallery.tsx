"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, stagger } from "@/lib/motion";

export interface ShelfItem {
  id: string;
  /** Cover image URL (local or your CDN). */
  image: string;
  /** Alt text for the cover. */
  alt: string;
  title: string;
  subtitle?: string;
}

export interface ShelfGalleryProps {
  /** Covers in order; they fill the shelves left to right, top to bottom. */
  items: ShelfItem[];
  /** Covers per shelf. @default 5 */
  perShelf?: number;
  /** Extra empty shelves below the filled ones, for the look of a wall that has room to grow. @default 0 */
  emptyShelves?: number;
  /** Called when a cover is opened. */
  onSelect?: (item: ShelfItem) => void;
  /** Extra content in the open view, under the title. */
  renderDetail?: (item: ShelfItem) => ReactNode;
  /** Accessible name for the wall. @default "Collection" */
  label?: string;
  /** Classes for the root. */
  className?: string;
}

function Cover({ item, index, onOpen, reduceMotion }: { item: ShelfItem; index: number; onOpen: (item: ShelfItem, el: HTMLButtonElement) => void; reduceMotion: boolean }) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const lift = useMotionValue(0);
  const spring = { stiffness: 260, damping: 22 };
  const rx = useSpring(useTransform(py, [0, 1], [8, -8]), spring);
  const ry = useSpring(useTransform(px, [0, 1], [-12, 12]), spring);
  const y = useSpring(useTransform(lift, [0, 1], [0, -12]), spring);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgb(255 255 255 / 0.45), transparent 55%)`;
  const glareOpacity = useSpring(lift, spring);

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
    lift.set(0);
  };

  return (
    <motion.li
      className="relative flex-1 [perspective:700px]"
      style={{ maxWidth: "11rem" }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -48 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: duration.base } : { type: "spring", stiffness: 220, damping: 18, delay: index * stagger.loose }}
    >
      <motion.button
        type="button"
        layoutId={`shelf-cover-${item.id}`}
        aria-label={`Open ${item.title}`}
        onClick={(e) => onOpen(item, e.currentTarget)}
        onPointerMove={(e) => {
          if (reduceMotion || e.pointerType === "touch") return;
          const r = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
          lift.set(1);
        }}
        onPointerLeave={reset}
        onFocus={() => !reduceMotion && lift.set(1)}
        onBlur={reset}
        style={reduceMotion ? undefined : { rotateX: rx, rotateY: ry, y, transformOrigin: "50% 100%" }}
        className="relative block aspect-square w-full cursor-pointer overflow-hidden rounded-[3px] bg-surface-2 shadow-[0_14px_18px_-12px_rgb(0_0_0/0.45),0_2px_4px_rgb(0_0_0/0.12)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- covers are arbitrary URLs */}
        <img src={item.image} alt={item.alt} className="size-full object-cover" draggable={false} />
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 mix-blend-soft-light" style={{ backgroundImage: glare, opacity: glareOpacity }} />
      </motion.button>
    </motion.li>
  );
}

function Shelf({ children }: { children?: ReactNode }) {
  return (
    <div className="relative">
      <ul className="relative z-10 flex items-end justify-center gap-[clamp(0.5rem,2.5cqw,1.5rem)] px-[6%]">{children}</ul>
      {/* The board: a thin slab with a lit top edge, a shadow below and light spilling onto the wall. */}
      <div aria-hidden="true" className="relative mx-[3%] h-[clamp(8px,1.4cqw,14px)] rounded-[2px] bg-[linear-gradient(#ffffff,#f1f1ef)] shadow-[0_1px_0_rgb(255_255_255),0_14px_24px_-10px_rgb(0_0_0/0.28),0_2px_3px_rgb(0_0_0/0.12)]">
        <span className="absolute inset-x-[8%] top-full h-24 bg-[radial-gradient(ellipse_at_top,rgb(255_255_255/0.9),transparent_70%)]" />
      </div>
    </div>
  );
}

/**
 * Covers standing on floating wall shelves: they settle onto the boards one by one, lift and tilt
 * toward the pointer with a soft glare, and fly forward into an open view with the title when chosen.
 */
export function ShelfGallery({ items, perShelf = 5, emptyShelves = 0, onSelect, renderDetail, label = "Collection", className }: ShelfGalleryProps) {
  const id = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const [open, setOpen] = useState<ShelfItem | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const per = Math.max(1, perShelf);
  const shelves = Array.from({ length: Math.ceil(items.length / per) }, (_, i) => items.slice(i * per, i * per + per));

  const show = (item: ShelfItem, el: HTMLButtonElement) => {
    opener.current = el;
    setOpen(item);
    onSelect?.(item);
  };
  const close = useCallback(() => {
    setOpen(null);
    // Return focus to the cover that opened the view.
    window.setTimeout(() => opener.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <LayoutGroup id={id}>
      <section aria-label={label} className={cn("@container relative isolate w-full overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_35%,#fbfbfa,#ebebe9_75%)] py-[clamp(2rem,8cqw,5rem)]", className)}>
        <div className="flex flex-col gap-[clamp(3rem,12cqw,8rem)]">
          {shelves.map((row, s) => (
            <Shelf key={s}>
              {row.map((item, i) => (
                <Cover key={item.id} item={item} index={s * per + i} onOpen={show} reduceMotion={reduceMotion} />
              ))}
            </Shelf>
          ))}
          {Array.from({ length: emptyShelves }, (_, i) => (
            <Shelf key={`empty-${i}`}>
              <li aria-hidden="true" className="h-px" />
            </Shelf>
          ))}
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              key="backdrop"
              className="absolute inset-0 z-20 flex items-center justify-center bg-[#ecebe8]/70 p-6 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.base, ease: ease.out }}
              onClick={(e) => e.target === e.currentTarget && close()}
            >
              <div role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} className="flex w-full max-w-md flex-col items-center gap-4 sm:flex-row sm:items-end">
                <motion.div layoutId={`shelf-cover-${open.id}`} className="aspect-square w-[min(16rem,70%)] shrink-0 overflow-hidden rounded-[4px] shadow-[0_30px_50px_-20px_rgb(0_0_0/0.5)]" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- covers are arbitrary URLs */}
                  <img src={open.image} alt={open.alt} className="size-full object-cover" />
                </motion.div>
                <motion.div
                  className="min-w-0 text-center sm:text-left"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: duration.base } }}
                  exit={{ opacity: 0, transition: { duration: duration.instant } }}
                >
                  <h3 id={`${id}-title`} className="text-lg font-semibold text-foreground">
                    {open.title}
                  </h3>
                  {open.subtitle ? <p className="text-sm text-muted-foreground">{open.subtitle}</p> : null}
                  {renderDetail?.(open)}
                  <button ref={closeRef} type="button" onClick={close} className="mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-4 text-[13px] font-medium text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring">
                    <X className="size-3.5" aria-hidden="true" />
                    Back to the shelf
                  </button>
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>
    </LayoutGroup>
  );
}
