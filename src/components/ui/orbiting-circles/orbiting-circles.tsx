"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface OrbitItem {
  /** Name shown in the tooltip and read by screen readers. */
  name: string;
  icon: ReactNode;
}

export interface OrbitRing {
  /** Ring radius in pixels at the design size; scales down with the container. */
  radius: number;
  /** Seconds per revolution. @default 30 */
  duration?: number;
  /** Orbit counter-clockwise. @default false */
  reverse?: boolean;
  /** Icon tile size in pixels at the design size. @default 40 */
  iconSize?: number;
  /** Icons on this ring, spaced evenly. */
  items: OrbitItem[];
}

export interface OrbitingCirclesProps extends Omit<ComponentProps<"div">, "children"> {
  /** Element at the center, e.g. your logo. */
  center?: ReactNode;
  /** One to three rings, innermost first. */
  rings: OrbitRing[];
  /** Draw the ring paths. @default true */
  showPaths?: boolean;
  /** Path style. @default "solid" */
  pathStyle?: "solid" | "dashed";
  /** Pause the whole system while hovered or focused. @default true */
  pauseOnHover?: boolean;
  /** Width the radii are designed for; smaller containers scale everything down. @default 480 */
  designSize?: number;
}

// Keyframes ship with the component (React 19 hoists and de-duplicates this <style>).
const KEYFRAMES =
  "@keyframes alibar-orbit-spin{to{transform:rotate(360deg)}}@keyframes alibar-orbit-counter{to{transform:rotate(-360deg)}}";

export function OrbitingCircles({
  center,
  rings,
  showPaths = true,
  pathStyle = "solid",
  pauseOnHover = true,
  designSize = 480,
  className,
  style,
  ...props
}: OrbitingCirclesProps) {
  return (
    <div
      className={cn("group/orbit relative mx-auto aspect-square w-full [container-type:inline-size]", className)}
      style={{ maxWidth: designSize, "--orbit-unit": `min(1px, 100cqw / ${designSize})`, ...style } as CSSProperties}
      {...props}
    >
      <style href="alibar-orbiting-circles" precedence="alibar">
        {KEYFRAMES}
      </style>
      {rings.map((ring, r) => {
        const duration = ring.duration ?? 30;
        const size = ring.iconSize ?? 40;
        const animation = {
          animationDuration: `${duration}s`,
          animationDirection: ring.reverse ? "reverse" : "normal",
        };
        const paused = pauseOnHover
          ? "group-hover/orbit:[animation-play-state:paused] group-focus-within/orbit:[animation-play-state:paused]"
          : "";
        return (
          <div key={r} className="pointer-events-none absolute inset-0" style={{ "--radius": `calc(${ring.radius} * var(--orbit-unit))` } as CSSProperties}>
            {showPaths ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-1/2 left-1/2 size-[calc(var(--radius)*2)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border",
                  pathStyle === "dashed" && "border-dashed",
                )}
              />
            ) : null}
            <ul
              aria-label={`Orbit ${r + 1}`}
              className={cn("absolute inset-0 [animation-iteration-count:infinite] [animation-name:alibar-orbit-spin] [animation-timing-function:linear] motion-reduce:[animation-name:none]", paused)}
              style={animation}
            >
              {ring.items.map((item, i) => {
                const angle = (360 / ring.items.length) * i;
                return (
                  <li
                    key={item.name}
                    className="absolute top-1/2 left-1/2"
                    style={{ transform: `rotate(${angle}deg) translateX(var(--radius)) rotate(${-angle}deg)` }}
                  >
                    {/* Counter-rotates at the same speed, so the icon stays upright. */}
                    <div
                      className={cn(
                        "[animation-iteration-count:infinite] [animation-name:alibar-orbit-counter] [animation-timing-function:linear] motion-reduce:[animation-name:none]",
                        paused,
                      )}
                      style={animation}
                    >
                      <span
                        tabIndex={0}
                        className="group/icon pointer-events-auto relative -mt-[calc(var(--s)/2)] -ml-[calc(var(--s)/2)] grid size-[var(--s)] place-items-center rounded-xl border border-border bg-background text-foreground shadow-sm outline-none transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] hover:scale-110 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none [&>svg]:size-[55%]"
                        style={{ "--s": `calc(${size} * var(--orbit-unit))` } as CSSProperties}
                      >
                        {item.icon}
                        <span className="sr-only">{item.name}</span>
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium whitespace-nowrap text-background opacity-0 transition-[opacity,transform] duration-150 group-hover/icon:translate-y-0 group-hover/icon:opacity-100 group-focus-visible/icon:translate-y-0 group-focus-visible/icon:opacity-100"
                        >
                          {item.name}
                        </span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {center ? <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">{center}</div> : null}
    </div>
  );
}
