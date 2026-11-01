"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { Dialog } from "radix-ui";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface LightboxImage {
  /** Image URL. */
  src: string;
  /** Description of the image. */
  alt: string;
  /** Intrinsic width; with height, keeps the aspect ratio while morphing. */
  width: number;
  /** Intrinsic height. */
  height: number;
  /** Optional caption under the open image. */
  caption?: string;
}

export interface ImageLightboxProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Images, in order. */
  images: LightboxImage[];
  /** Controlled index of the open image, or null when closed. */
  index?: number | null;
  /** Called when an image opens, changes or the lightbox closes. */
  onIndexChange?: (index: number | null) => void;
}

const MORPH = { type: "spring", stiffness: 300, damping: 32 } as const;

export function ImageLightbox({ images, index, onIndexChange, className, ...props }: ImageLightboxProps) {
  const reduceMotion = useReducedMotion();
  const [internal, setInternal] = useState<number | null>(null);
  const current = index === undefined ? internal : index;
  // Shared-layout morphs only while opening and closing; swiping between images just slides.
  const [linked, setLinked] = useState(true);
  const [direction, setDirection] = useState(1);
  const id = useId();
  const layout = reduceMotion ? { duration: 0 } : MORPH;
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastIndex = useRef(0);
  useEffect(() => {
    if (current !== null) lastIndex.current = current;
  }, [current]);

  const set = (next: number | null) => {
    if (index === undefined) setInternal(next);
    onIndexChange?.(next);
  };
  const open = (i: number) => {
    setLinked(true);
    set(i);
  };
  // Link the current image to its thumbnail first, then close, so it morphs back to the right spot.
  const close = () => {
    setLinked(true);
    requestAnimationFrame(() => set(null));
  };
  const step = (delta: number) => {
    if (current === null || images.length < 2) return;
    setLinked(false);
    setDirection(delta);
    set((current + delta + images.length) % images.length);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") step(1);
    else if (event.key === "ArrowLeft") step(-1);
    else return;
    event.preventDefault();
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -500) step(1);
    else if (info.offset.x > 80 || info.velocity.x > 500) step(-1);
  };

  const image = current === null ? null : images[current];
  const slide = {
    enter: (dir: number) => (reduceMotion ? { opacity: 0 } : { x: `${dir * 30}%`, opacity: 0 }),
    center: { x: "0%", opacity: 1 },
    exit: (dir: number) => (reduceMotion ? { opacity: 0 } : { x: `${dir * -30}%`, opacity: 0 }),
  };

  return (
    <>
      <div className={cn("columns-2 gap-3 sm:columns-3", className)} {...props}>
        {images.map((img, i) => (
          <button
            key={img.src}
            ref={(node) => {
              thumbs.current[i] = node;
            }}
            type="button"
            onClick={() => open(i)}
            aria-label={`Open image: ${img.alt}`}
            aria-haspopup="dialog"
            className="mb-3 block w-full cursor-zoom-in break-inside-avoid rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {current === i ? (
              <span className="block w-full" style={{ aspectRatio: `${img.width} / ${img.height}` }} />
            ) : (
              <motion.img
                layoutId={`${id}-${i}`}
                transition={layout}
                src={img.src}
                alt=""
                width={img.width}
                height={img.height}
                draggable={false}
                className="block h-auto w-full object-cover"
                style={{ borderRadius: 12 }}
              />
            )}
          </button>
        ))}
      </div>

      <Dialog.Root open={current !== null} onOpenChange={(next) => !next && close()}>
        <AnimatePresence>
          {image && current !== null ? (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: duration.base }}
                />
              </Dialog.Overlay>
              <Dialog.Content
                forceMount
                aria-describedby={undefined}
                onKeyDown={onKeyDown}
                // Return focus to the thumbnail of the image that was showing, not the one first opened.
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  thumbs.current[lastIndex.current]?.focus({ preventScroll: true });
                }}
                className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4 outline-none sm:p-6"
              >
                <Dialog.Title className="sr-only">{image.alt}</Dialog.Title>
                <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
                  <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.img
                      key={current}
                      layoutId={linked ? `${id}-${current}` : undefined}
                      src={image.src}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      draggable={false}
                      custom={direction}
                      variants={slide}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ layout, x: { type: "spring", stiffness: 320, damping: 34 }, opacity: { duration: duration.base, ease: ease.out } }}
                      drag={images.length > 1 ? "x" : false}
                      dragSnapToOrigin
                      dragElastic={0.6}
                      onDragEnd={onDragEnd}
                      className="block h-auto max-h-full touch-pan-y object-contain shadow-xl select-none"
                      style={{
                        aspectRatio: `${image.width} / ${image.height}`,
                        width: `min(100%, calc((100dvh - 9rem) * ${image.width / image.height}), ${image.width}px)`,
                        borderRadius: 12,
                      }}
                    />
                  </AnimatePresence>
                </div>
                <div className="flex w-full max-w-2xl items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    disabled={images.length < 2}
                    aria-label="Previous image"
                    className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </button>
                  <div className="min-w-0 text-center">
                    {image.caption ? <p className="truncate text-sm text-foreground">{image.caption}</p> : null}
                    <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                      {current + 1} / {images.length}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    disabled={images.length < 2}
                    aria-label="Next image"
                    className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <Dialog.Close
                  aria-label="Close"
                  className="absolute top-4 right-4 inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-4" aria-hidden="true" />
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          ) : null}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}
