"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Clock3, Gauge, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { formatAmount, formatUsd, toUsd } from "@/lib/web3/format";
import { RollingValue } from "@/lib/web3/rolling-value";

export interface GasOption {
  id: string;
  label: string;
  /** Max fee per gas, in wei. */
  maxFeePerGas: bigint;
  /** Typical confirmation time, in seconds. */
  seconds: number;
}

export interface GasFeeSelectorProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Speed options, usually slow, standard and fast. */
  options: GasOption[];
  /** Controlled selected option id. */
  value?: string;
  /** Initial option when uncontrolled. @default the middle option */
  defaultValue?: string;
  /** Called when the selection changes. */
  onValueChange?: (id: string) => void;
  /** Gas the transaction uses. @default 150000n */
  gasUnits?: bigint;
  /** Native token symbol. @default "ETH" */
  nativeSymbol?: string;
  /** Native token price in USD with 8 decimals, for the USD estimate. */
  nativePrice?: bigint;
  /** Show the pulsing live indicator (fees update in real time). @default true */
  live?: boolean;
  /** Heading. @default "Network fee" */
  label?: string;
}

const ICONS: LucideIcon[] = [Clock3, Gauge, Zap];

function formatEta(seconds: number) {
  if (seconds < 60) return `~${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `~${minutes} min`;
}

export function GasFeeSelector({
  options,
  value,
  defaultValue,
  onValueChange,
  gasUnits = BigInt(150000),
  nativeSymbol = "ETH",
  nativePrice,
  live = true,
  label = "Network fee",
  className,
  ...props
}: GasFeeSelectorProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const id = useId();
  const [internal, setInternal] = useState(defaultValue ?? options[Math.floor(options.length / 2)]?.id);
  const selected = value ?? internal;
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = options.findIndex((o) => o.id === selected);
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    select(options[next].id);
    buttons.current[next]?.focus();
  }

  return (
    <div className={cn("w-full max-w-lg", className)} {...props}>
      <div className="mb-2.5 flex items-center justify-between">
        <p id={`${id}-label`} className="text-sm font-medium text-foreground">
          {label}
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex size-2" aria-hidden="true">
            {live ? <span className="absolute inset-0 animate-ping rounded-full bg-success/60 motion-reduce:animate-none" /> : null}
            <span className={cn("relative size-2 rounded-full", live ? "bg-success" : "bg-muted-foreground/50")} />
          </span>
          {live ? "Live" : "Paused"}
        </span>
      </div>
      <LayoutGroup id={id}>
        <div role="radiogroup" aria-labelledby={`${id}-label`} onKeyDown={onKeyDown} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {options.map((option, index) => {
            const active = option.id === selected;
            const Icon = ICONS[Math.min(index, ICONS.length - 1)];
            const fee = option.maxFeePerGas * gasUnits;
            return (
              <button
                key={option.id}
                ref={(node) => {
                  buttons.current[index] = node;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => select(option.id)}
                className={cn(
                  "group relative flex cursor-pointer flex-col items-start rounded-2xl border p-3.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active ? "border-transparent" : "border-border bg-background hover:bg-surface",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="gas-selected"
                    transition={reduceMotion ? { duration: 0 } : spring.snappy}
                    className="absolute inset-0 rounded-2xl border-2 border-foreground bg-surface"
                  />
                ) : null}
                <span className="relative flex w-full items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                    {option.label}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">{formatEta(option.seconds)}</span>
                </span>
                <span className="relative mt-3 font-mono text-base font-semibold text-foreground tabular-nums">
                  {nativePrice !== undefined ? <RollingValue value={formatUsd(toUsd(fee, 18, nativePrice))} trend={fee} /> : `${formatAmount(fee, 18, { maxFractionDigits: 5 })} ${nativeSymbol}`}
                </span>
                {nativePrice !== undefined ? (
                  <span className="relative mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                    {formatAmount(fee, 18, { maxFractionDigits: 5 })} {nativeSymbol}
                  </span>
                ) : null}
                <span className="relative font-mono text-[11px] text-muted-foreground tabular-nums">
                  {formatAmount(option.maxFeePerGas, 9, { maxFractionDigits: 1 })} gwei
                </span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
