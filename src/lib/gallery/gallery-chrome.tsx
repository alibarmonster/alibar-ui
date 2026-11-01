import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/lib/gallery/types";

/** "light" = a light (or transparent) background that needs dark text; "dark" = a dark one. */
export type ChromeScheme = "light" | "dark";

/**
 * Picks caption and control colors for a background. Understands hex and rgb()/rgba(); anything
 * else (named colors, var()) and transparent backgrounds count as light, like the page itself.
 */
export function chromeScheme(background?: string): ChromeScheme {
  if (!background) return "light";
  const value = background.trim().toLowerCase();
  let rgb: number[] | null = null;
  let alpha = 1;
  const hex = value.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    const h = hex[1];
    const full = h.length <= 4 ? [...h].map((c) => c + c).join("") : h;
    rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
    if (full.length === 8) alpha = parseInt(full.slice(6, 8), 16) / 255;
  }
  const fn = value.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    rgb = parts.slice(0, 3);
    if (parts.length > 3) alpha = parts[3] > 1 ? parts[3] / 100 : parts[3];
  }
  if (!rgb || alpha < 0.5) return "light";
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.25 ? "dark" : "light";
}

export interface GalleryCaptionProps {
  item: GalleryItem | undefined;
  index: number;
  /** Item count, so wrapping from last to first slides the right way. */
  count: number;
  scheme?: ChromeScheme;
  className?: string;
}

/**
 * Title and subtitle of the active item. It slides in from the direction of travel. Screen readers
 * get the same text from the gallery's live region, so this copy is aria-hidden.
 */
export function GalleryCaption({ item, index, count, scheme = "light", className }: GalleryCaptionProps) {
  const reduceMotion = useReducedMotion();
  const [previous, setPrevious] = useState(index);
  const [direction, setDirection] = useState(1);
  if (previous !== index) {
    let delta = index - previous;
    if (count > 2 && Math.abs(delta) > count / 2) delta -= Math.sign(delta) * count;
    setDirection(delta >= 0 ? 1 : -1);
    setPrevious(index);
  }
  const shift = reduceMotion ? 0 : 14;
  return (
    <div aria-hidden="true" className={cn("relative h-10 min-w-0 overflow-hidden", className)}>
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={index}
          custom={direction}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: shift * d, filter: reduceMotion ? "blur(0px)" : "blur(4px)" }),
            center: { opacity: 1, x: 0, filter: "blur(0px)" },
            exit: (d: number) => ({ opacity: 0, x: -shift * d, filter: reduceMotion ? "blur(0px)" : "blur(4px)" }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: duration.base, ease: ease.out }}
          className="absolute inset-0"
        >
          <p className={cn("truncate text-sm font-medium", scheme === "dark" ? "text-white" : "text-foreground")}>{item?.title ?? item?.alt}</p>
          {item?.subtitle ? <p className={cn("truncate text-[13px]", scheme === "dark" ? "text-white/65" : "text-muted-foreground")}>{item.subtitle}</p> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export interface GalleryControlsProps {
  index: number;
  count: number;
  onPrevious: () => void;
  onNext: () => void;
  scheme?: ChromeScheme;
  /** Disable the buttons at the ends of a gallery that doesn't loop. @default false */
  bounded?: boolean;
  className?: string;
}

/** Previous / next buttons with an "n / total" counter. */
export function GalleryControls({ index, count, onPrevious, onNext, scheme = "light", bounded = false, className }: GalleryControlsProps) {
  const button = cn(
    "grid size-10 cursor-pointer place-items-center rounded-full border transition-[background-color,opacity,transform] duration-150 outline-none active:scale-[0.94] disabled:pointer-events-none disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
    scheme === "dark" ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-border bg-background/80 text-foreground hover:bg-surface-2",
  );
  return (
    <div data-gallery-control className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <button type="button" data-gallery-control aria-label="Previous" onClick={onPrevious} disabled={bounded && index <= 0} className={button}>
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>
      <span aria-hidden="true" className={cn("min-w-14 text-center font-mono text-[13px] tabular-nums", scheme === "dark" ? "text-white/75" : "text-muted-foreground")}>
        {index + 1} / {count}
      </span>
      <button type="button" data-gallery-control aria-label="Next" onClick={onNext} disabled={bounded && index >= count - 1} className={button}>
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
