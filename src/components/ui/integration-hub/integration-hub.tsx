"use client";

import { createRef, useMemo, useRef, type ComponentProps, type ReactNode, type RefObject } from "react";
import { AnimatedBeam } from "@/components/ui/animated-beam/animated-beam";
import { cn } from "@/lib/utils";

export interface HubItem {
  /** Tool name, shown under the icon and read by screen readers. */
  name: string;
  icon: ReactNode;
}

export interface IntegrationHubProps extends Omit<ComponentProps<"div">, "children"> {
  /** Your product at the center. */
  center: ReactNode;
  /** Tools around the hub, split between the left and right columns (up to 8). */
  items: HubItem[];
  /** Seconds for one pulse along each beam. @default 3 */
  duration?: number;
  /** Pulses flow into the hub instead of out of it. @default false */
  inbound?: boolean;
  /** Show tool names under the icons. @default true */
  showLabels?: boolean;
}

function Tile({ tileRef, item, showLabels }: { tileRef: RefObject<HTMLDivElement | null>; item: HubItem; showLabels: boolean }) {
  return (
    <li className="z-10 flex flex-col items-center gap-1.5">
      <div
        ref={tileRef}
        className="grid size-12 place-items-center rounded-xl border border-border bg-background text-foreground shadow-sm transition-transform duration-300 hover:scale-105 motion-reduce:transition-none [&>svg]:size-6"
      >
        {item.icon}
      </div>
      <span className={cn("text-[11px] font-medium text-muted-foreground", !showLabels && "sr-only")}>{item.name}</span>
    </li>
  );
}

export function IntegrationHub({ center, items, duration = 3, inbound = false, showLabels = true, className, ...props }: IntegrationHubProps) {
  const container = useRef<HTMLDivElement>(null);
  const hub = useRef<HTMLDivElement>(null);
  const list = items.slice(0, 8);
  // One ref per tile; recreated only when the number of tiles changes.
  const refs = useMemo(() => list.map(() => createRef<HTMLDivElement>()), [list.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const half = Math.ceil(list.length / 2);
  const left = list.slice(0, half);
  const right = list.slice(half);

  return (
    <div ref={container} className={cn("relative mx-auto flex w-full max-w-xl items-center justify-between gap-6 px-4 py-6", className)} {...props}>
      <ul className="flex flex-col gap-5" aria-label="Integrations">
        {left.map((item, i) => (
          <Tile key={item.name} tileRef={refs[i]} item={item} showLabels={showLabels} />
        ))}
      </ul>
      <div ref={hub} className="z-10 grid size-20 shrink-0 place-items-center rounded-3xl border border-border bg-background shadow-md">
        {center}
      </div>
      <ul className="flex flex-col gap-5" aria-label="More integrations">
        {right.map((item, i) => (
          <Tile key={item.name} tileRef={refs[half + i]} item={item} showLabels={showLabels} />
        ))}
      </ul>
      {list.map((item, i) => {
        const isLeft = i < half;
        const row = isLeft ? i : i - half;
        const rows = isLeft ? left.length : right.length;
        // Curve beams away from the middle row so they fan out instead of overlapping.
        const curvature = (row - (rows - 1) / 2) * -18 * (isLeft ? 1 : -1);
        return (
          <AnimatedBeam
            key={item.name}
            containerRef={container}
            fromRef={refs[i]}
            toRef={hub}
            curvature={curvature}
            reverse={!inbound}
            duration={duration}
            delay={(i * duration) / list.length}
            startYOffset={showLabels ? -10 : 0}
          />
        );
      })}
    </div>
  );
}
