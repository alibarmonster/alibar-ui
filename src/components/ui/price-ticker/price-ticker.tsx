"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "motion/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent, formatUsd, USD_DECIMALS } from "@/lib/web3/format";
import { TokenIcon } from "@/lib/web3/icons";
import { RollingValue } from "@/lib/web3/rolling-value";
import type { Token } from "@/lib/web3/types";

export interface TickerItem {
  /** Pair label, e.g. "ETH/USD". */
  label: string;
  /** Token for the icon. */
  token?: Pick<Token, "symbol" | "iconUrl" | "color">;
  /** Price as a bigint with `priceDecimals` decimals. */
  price: bigint;
  /** Decimals of `price`. @default 8 */
  priceDecimals?: number;
  /** 24h change as a ratio: 0.0214 is +2.14%. */
  change24h?: number;
}

export interface PriceTickerProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Pairs to show, in order. */
  items: TickerItem[];
  /** Scroll speed in pixels per second. @default 40 */
  speed?: number;
  /** Scroll direction. @default "left" */
  direction?: "left" | "right";
  /** Pause while hovered or focused. @default true */
  pauseOnHover?: boolean;
  /** Accessible name of the ticker. @default "Live prices" */
  label?: string;
}

function Item({ item }: { item: TickerItem }) {
  const change = item.change24h ?? 0;
  const up = change > 0;
  const down = change < 0;
  return (
    <span className="flex shrink-0 items-center gap-2 px-5 text-sm whitespace-nowrap">
      {item.token ? <TokenIcon token={item.token} size={20} /> : null}
      <span className="font-medium text-foreground">{item.label}</span>
      <span className="font-mono text-foreground">
        <RollingValue value={formatUsd(item.price, item.priceDecimals ?? USD_DECIMALS)} trend={item.price} />
      </span>
      {item.change24h !== undefined ? (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-mono text-xs tabular-nums",
            up && "text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]",
            down && "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]",
            !up && !down && "text-muted-foreground",
          )}
        >
          {up ? <TrendingUp className="size-3" aria-hidden="true" /> : down ? <TrendingDown className="size-3" aria-hidden="true" /> : null}
          {formatPercent(change, { signed: true })}
        </span>
      ) : null}
    </span>
  );
}

export function PriceTicker({
  items,
  speed = 40,
  direction = "left",
  pauseOnHover = true,
  label = "Live prices",
  className,
  ...props
}: PriceTickerProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const x = useMotionValue(0);
  const track = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const paused = useRef(false);
  const velocity = useRef(1);

  // One copy's width sets the loop length; re-measured when items or fonts change size.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.scrollWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduceMotion || width === 0) return;
    // Ease the speed toward 0 (paused) or 1, so hovering slows rather than snaps.
    const target = paused.current ? 0 : 1;
    velocity.current += (target - velocity.current) * Math.min(1, delta / 180);
    if (Math.abs(target - velocity.current) < 0.005) velocity.current = target;
    if (velocity.current === 0) return;
    const sign = direction === "left" ? -1 : 1;
    let next = x.get() + sign * speed * velocity.current * (delta / 1000);
    if (next <= -width) next += width;
    if (next > 0) next -= width;
    x.set(next);
  });

  const pause = (value: boolean) => {
    if (pauseOnHover) paused.current = value;
  };

  return (
    <div
      role="region"
      aria-label={label}
      onPointerEnter={() => pause(true)}
      onPointerLeave={() => pause(false)}
      onFocus={() => pause(true)}
      onBlur={() => pause(false)}
      className={cn(
        "relative w-full overflow-hidden border-y border-border bg-background py-3",
        "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:overflow-x-auto",
        className,
      )}
      {...props}
    >
      <motion.div className="flex w-max" style={{ x }}>
        <div ref={track} className="flex">
          {items.map((item) => (
            <Item key={item.label} item={item} />
          ))}
        </div>
        {/* A second copy makes the loop seamless; it's hidden from assistive tech (and entirely under reduced motion). */}
        <div className="flex motion-reduce:hidden" aria-hidden="true" inert>
          {items.map((item) => (
            <Item key={item.label} item={item} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
