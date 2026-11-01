"use client";

import { useId, useState, type ComponentProps, type MouseEvent } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion, type Variants } from "motion/react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface LikeButtonProps
  extends Omit<ComponentProps<"button">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Controlled liked state. */
  liked?: boolean;
  /** Initial liked state when uncontrolled. @default false */
  defaultLiked?: boolean;
  /** Called when the viewer toggles their like. */
  onLikedChange?: (liked: boolean) => void;
  /** Likes from everyone else; the viewer's like is added on top. Omit it to hide the counter. */
  count?: number;
  /** Formats the counter. @default compact notation, e.g. 2.4K */
  formatCount?: (count: number) => string;
  /** Visual style. @default "outline" */
  variant?: "outline" | "ghost";
  /** Button size. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Accessible name of the button. @default "Like" */
  label?: string;
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const sizeClasses = {
  sm: { base: "h-8 gap-1.5 px-3 text-[13px]", icon: "size-8", heart: "size-4" },
  md: { base: "h-10 gap-2 px-3.5 text-sm", icon: "size-10", heart: "size-[18px]" },
  lg: { base: "h-12 gap-2.5 px-5 text-[15px]", icon: "size-12", heart: "size-6" },
} as const;

const PARTICLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
  const distance = i % 2 ? 15 : 21;
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, size: i % 2 ? 4 : 5 };
});

function Burst() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <motion.span
        className="absolute inset-0 rounded-full border-2 border-destructive"
        initial={{ scale: 0.3, opacity: 0.7 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ duration: 0.5, ease: ease.out }}
      />
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className={cn("absolute top-1/2 left-1/2 rounded-full", i % 2 ? "bg-destructive/55" : "bg-destructive")}
          style={{ width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2 }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: [0, 1, 0], opacity: [1, 1, 0] }}
          transition={{ duration: 0.6, ease: ease.out, delay: 0.06 }}
        />
      ))}
    </span>
  );
}

export function LikeButton({
  liked: likedProp,
  defaultLiked = false,
  onLikedChange,
  count,
  formatCount = (n) => compact.format(n),
  variant = "outline",
  size = "md",
  label = "Like",
  type = "button",
  className,
  onClick,
  ...props
}: LikeButtonProps) {
  const [internalLiked, setInternalLiked] = useState(defaultLiked);
  const liked = likedProp ?? internalLiked;
  const [bursts, setBursts] = useState(0);
  const [direction, setDirection] = useState(1);
  const [heart, animateHeart] = useAnimate<HTMLSpanElement>();
  const reduceMotion = useReducedMotion();
  const countId = useId();
  const total = count === undefined ? undefined : count + (liked ? 1 : 0);

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const next = !liked;
    if (likedProp === undefined) setInternalLiked(next);
    onLikedChange?.(next);
    setDirection(next ? 1 : -1);
    if (reduceMotion || !heart.current) return;
    if (next) {
      setBursts((n) => n + 1);
      animateHeart(heart.current, { scale: [1, 0.7, 1.3, 0.95, 1] }, { duration: 0.55, times: [0, 0.15, 0.45, 0.75, 1], ease: ease.out });
    } else {
      animateHeart(heart.current, { scale: [1, 0.85, 1] }, { duration: duration.base, ease: ease.out });
    }
  }

  const roll: Variants = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: (dir: number) => ({ y: dir > 0 ? "100%" : "-100%", opacity: 0, filter: "blur(2px)" }),
        animate: { y: "0%", opacity: 1, filter: "blur(0px)" },
        exit: (dir: number) => ({ y: dir > 0 ? "-100%" : "100%", opacity: 0, filter: "blur(2px)" }),
      };

  return (
    <button
      type={type}
      aria-pressed={liked}
      // The visible count is part of the name (WCAG 2.5.3: the visible label is in the accessible name).
      aria-label={total === undefined ? label : `${label}, ${formatCount(total)}`}
      onClick={toggle}
      className={cn(
        "group relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-medium whitespace-nowrap tabular-nums outline-none select-none",
        "transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "outline" && "border border-border bg-background shadow-xs",
        variant === "outline" && !liked && "hover:bg-accent",
        liked ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        total === undefined ? sizeClasses[size].icon : sizeClasses[size].base,
        size === "sm" && "after:absolute after:-inset-1 after:content-['']",
        className,
      )}
      {...props}
    >
      {/* A soft tint fades in when liked, instead of animating background-color. */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ opacity: liked && variant === "outline" ? 1 : 0 }}
        transition={{ duration: duration.base }}
        className="pointer-events-none absolute -inset-px rounded-full border border-destructive/25 bg-destructive/[0.06]"
      />

      <span className={cn("relative grid place-items-center", sizeClasses[size].heart)}>
        {bursts > 0 && liked ? <Burst key={bursts} /> : null}
        <span ref={heart} className="grid place-items-center *:[grid-area:1/1]">
          <motion.span
            aria-hidden="true"
            initial={false}
            animate={{ opacity: liked ? 0 : 1 }}
            transition={{ duration: duration.instant }}
          >
            <Heart className={cn("block", sizeClasses[size].heart)} strokeWidth={2} />
          </motion.span>
          <motion.span
            aria-hidden="true"
            initial={false}
            animate={{ opacity: liked ? 1 : 0 }}
            transition={{ duration: duration.instant }}
            className="text-destructive"
          >
            <Heart className={cn("block", sizeClasses[size].heart)} fill="currentColor" strokeWidth={2} />
          </motion.span>
        </span>
      </span>

      {total !== undefined ? (
        <span id={countId} className="relative inline-flex h-[1.25em] items-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.span
              key={total}
              custom={direction}
              variants={roll}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: duration.base, ease: ease.out }}
              className="inline-block"
            >
              {formatCount(total)}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : null}
    </button>
  );
}
