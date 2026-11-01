"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlert, CircleCheck, Info, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface Banner {
  /** Stable id, used for dismissal. */
  id: string;
  /** Main line. */
  title: ReactNode;
  /** Secondary line. */
  description?: ReactNode;
  /** Icon and accent color. */
  tone?: "info" | "success" | "warning" | "promo";
  /** Replaces the tone's default icon. */
  icon?: ReactNode;
  /** One call to action. */
  action?: { label: string; onClick: () => void };
}

export interface BannerStackProps
  extends Omit<ComponentProps<"section">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Banners, frontmost first. */
  banners: Banner[];
  /** Called after a banner is dismissed. The stack also hides it on its own. */
  onDismiss?: (id: string) => void;
  /** How many cards are visible in the stack. @default 3 */
  depth?: number;
}

const toneStyles = {
  info: { chip: "bg-primary/10 text-primary", icon: Info },
  success: { chip: "bg-success/12 text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]", icon: CircleCheck },
  warning: { chip: "bg-warning/12 text-warning", icon: CircleAlert },
  promo: { chip: "bg-foreground text-background", icon: Sparkles },
} as const;

// Each card behind the front one peeks out by this much.
const PEEK = 10;

export function BannerStack({ banners, onDismiss, depth = 3, className, "aria-label": ariaLabel, ...props }: BannerStackProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [frontHeight, setFrontHeight] = useState(0);
  const frontRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const visible = banners.filter((b) => !dismissed.has(b.id));
  const front = visible[0];
  const behind = Math.min(visible.length - 1, depth - 1);

  // The container reserves the front card's height plus the peeking edges behind it.
  useEffect(() => {
    const el = frontRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setFrontHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, [front?.id]);

  function dismiss(id: string) {
    setDismissed((current) => new Set(current).add(id));
    onDismiss?.(id);
  }

  if (!front) return null;

  return (
    <section
      aria-label={ariaLabel ?? "Announcements"}
      className={cn("relative w-full", className)}
      style={{ height: frontHeight ? frontHeight + behind * PEEK : undefined }}
      {...props}
    >
      <AnimatePresence initial={false}>
        {visible.slice(0, depth + 1).map((banner, index) => {
          const isFront = index === 0;
          const tone = toneStyles[banner.tone ?? "info"];
          const Icon = tone.icon;
          return (
            <motion.div
              key={banner.id}
              ref={isFront ? frontRef : undefined}
              aria-hidden={!isFront || undefined}
              inert={!isFront || undefined}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: depth * PEEK, scale: 1 - depth * 0.04 }}
              animate={{
                opacity: index < depth ? 1 : 0,
                y: reduceMotion ? 0 : index * PEEK,
                scale: reduceMotion ? 1 : 1 - index * 0.04,
              }}
              exit={
                reduceMotion
                  ? { opacity: 0, transition: { duration: duration.quick } }
                  : { opacity: 0, y: -14, scale: 1.02, filter: "blur(3px)", transition: { duration: duration.base, ease: ease.out } }
              }
              transition={reduceMotion ? { duration: duration.quick } : { type: "spring", stiffness: 360, damping: 30 }}
              style={{ zIndex: depth + 1 - index }}
              className={cn(
                "absolute inset-x-0 top-0 origin-bottom rounded-[14px] border border-border bg-popover text-popover-foreground shadow-md",
                // Cards behind keep the front card's height so only their edge shows.
                !isFront && "overflow-hidden",
              )}
            >
              <div
                style={!isFront && frontHeight ? { height: frontHeight } : undefined}
                className={cn("flex items-start gap-3 p-4 pr-11", !isFront && "opacity-0")}
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4", tone.chip)} aria-hidden="true">
                  {banner.icon ?? <Icon />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{banner.title}</p>
                  {banner.description ? (
                    <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{banner.description}</p>
                  ) : null}
                  <div className="mt-2.5 flex items-center gap-3">
                    {banner.action ? (
                      <button
                        type="button"
                        onClick={banner.action.onClick}
                        className="inline-flex h-7 cursor-pointer items-center rounded-md bg-foreground px-2.5 text-xs font-medium text-background outline-none hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {banner.action.label}
                      </button>
                    ) : null}
                    {isFront && visible.length > 1 ? (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {visible.length - 1} more
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss announcement"
                  onClick={() => dismiss(banner.id)}
                  className="absolute top-3 right-3 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors after:absolute after:-inset-1.5 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {visible.length > 1 ? `${visible.length} announcements` : "1 announcement"}
      </span>
    </section>
  );
}
