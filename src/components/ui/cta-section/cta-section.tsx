"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CtaAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface CtaSectionProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** Headline. */
  title: ReactNode;
  /** Supporting line under the headline. */
  description?: ReactNode;
  /** Small line above the headline. */
  eyebrow?: string;
  /** Main call to action. */
  primaryAction?: CtaAction;
  /** Secondary call to action. */
  secondaryAction?: CtaAction;
  /** Beam color (any CSS color). @default the primary color */
  beamColor?: string;
  /** Seconds for one lap around the border. @default 6 */
  duration?: number;
  /** Corner radius of the card in pixels. @default 24 */
  radius?: number;
}

function Action({ action, primary }: { action: CtaAction; primary?: boolean }) {
  const classes = cn(
    "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    primary ? "group bg-foreground text-background hover:bg-foreground/90" : "border border-border bg-background text-foreground hover:bg-surface",
  );
  const content = (
    <>
      {action.label}
      {primary ? <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" /> : null}
    </>
  );
  return action.href ? (
    <a href={action.href} onClick={action.onClick} className={classes}>
      {content}
    </a>
  ) : (
    <button type="button" onClick={action.onClick} className={classes}>
      {content}
    </button>
  );
}

export function CtaSection({
  title,
  description,
  eyebrow,
  primaryAction,
  secondaryAction,
  beamColor = "var(--primary)",
  duration = 6,
  radius = 24,
  className,
  ...props
}: CtaSectionProps) {
  const beam = useRef<SVGGElement>(null);

  // Both dashes travel together with the Web Animations API: constant speed around any shape,
  // no per-frame JavaScript. Reduced motion leaves a still highlight on the border.
  useEffect(() => {
    const group = beam.current;
    if (!group) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animations: Animation[] = [];
    const start = () => {
      animations.forEach((a) => a.cancel());
      animations = [];
      if (query.matches) return;
      group.querySelectorAll("rect").forEach((rect) => {
        const from = Number(rect.dataset.offset ?? 0);
        animations.push(
          rect.animate([{ strokeDashoffset: from }, { strokeDashoffset: from - 1 }], { duration: duration * 1000, iterations: Infinity, easing: "linear" }),
        );
      });
    };
    start();
    query.addEventListener("change", start);
    return () => {
      query.removeEventListener("change", start);
      animations.forEach((a) => a.cancel());
    };
  }, [duration]);

  return (
    <section className={cn("relative w-full", className)} {...props}>
      <div className="relative overflow-hidden border border-border bg-background px-6 py-14 text-center shadow-sm sm:px-12" style={{ borderRadius: radius }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: `radial-gradient(60% 80% at 50% 0%, color-mix(in oklab, ${beamColor} 9%, transparent), transparent 70%)` }}
        />
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <g ref={beam} style={{ filter: `drop-shadow(0 0 6px ${beamColor})` }}>
            <rect
              x="0.5"
              y="0.5"
              width="100%"
              height="100%"
              rx={radius}
              fill="none"
              stroke={beamColor}
              strokeOpacity={0.35}
              strokeWidth={1.5}
              pathLength={1}
              strokeDasharray="0.18 0.82"
              strokeDashoffset={0}
              data-offset={0}
              style={{ width: "calc(100% - 1px)", height: "calc(100% - 1px)" }}
            />
            <rect
              x="0.5"
              y="0.5"
              width="100%"
              height="100%"
              rx={radius}
              fill="none"
              stroke={beamColor}
              strokeWidth={2}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="0.04 0.96"
              strokeDashoffset={-0.14}
              data-offset={-0.14}
              style={{ width: "calc(100% - 1px)", height: "calc(100% - 1px)" }}
            />
          </g>
        </svg>
        <div className="relative mx-auto max-w-xl">
          {eyebrow ? <p className="text-sm font-medium text-primary">{eyebrow}</p> : null}
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">{title}</h2>
          {description ? <p className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-pretty text-muted-foreground">{description}</p> : null}
          {primaryAction || secondaryAction ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {primaryAction ? <Action action={primaryAction} primary /> : null}
              {secondaryAction ? <Action action={secondaryAction} /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
