"use client";

import { useId, useState, type ReactNode } from "react";
import { Popover } from "radix-ui";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { overlayVariants, spring } from "@/lib/motion";

export interface SlippageSettingsProps {
  /** Max slippage in basis points (50 = 0.5%). */
  value: number;
  /** Called with the new slippage in basis points. */
  onValueChange: (bps: number) => void;
  /** Preset chips in basis points. @default [10, 50, 100] */
  presets?: number[];
  /** Custom trigger. Defaults to a settings button showing the current value. */
  trigger?: ReactNode;
  /** Popover alignment against the trigger. @default "end" */
  align?: "start" | "center" | "end";
  /** Below this many bps, warn that the transaction may fail. @default 5 */
  lowThreshold?: number;
  /** Above this many bps, warn about frontrunning. @default 500 */
  highThreshold?: number;
  /** Highest accepted value in bps. @default 5000 */
  max?: number;
  /** Controlled open state. */
  open?: boolean;
  /** Called when the popover opens or closes. */
  onOpenChange?: (open: boolean) => void;
}

/** "0.5" → 50 bps, using string math only. Returns null for anything that isn't a percentage. */
function percentToBps(text: string): number | null {
  const clean = text.replace(",", ".").replace(/%$/, "").trim();
  if (!/^\d*\.?\d{0,2}$/.test(clean) || clean === "" || clean === ".") return null;
  const [integer, fraction = ""] = clean.split(".");
  return Number(integer || "0") * 100 + Number(fraction.padEnd(2, "0"));
}

const bpsToPercent = (bps: number) => `${Math.floor(bps / 100)}${bps % 100 ? `.${String(bps % 100).padStart(2, "0").replace(/0$/, "")}` : ""}`;

export function SlippageSettings({
  value,
  onValueChange,
  presets = [10, 50, 100],
  trigger,
  align = "end",
  lowThreshold = 5,
  highThreshold = 500,
  max = 5000,
  open,
  onOpenChange,
}: SlippageSettingsProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const id = useId();
  const isPreset = presets.includes(value);
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (isPreset ? "" : bpsToPercent(value));
  const draftBps = draft === null ? null : percentToBps(draft);
  const invalid = draft !== null && draft !== "" && (draftBps === null || draftBps > max);

  const warning = invalid
    ? { tone: "error" as const, text: `Enter a value between 0.01% and ${bpsToPercent(max)}%.` }
    : value < lowThreshold
      ? { tone: "warning" as const, text: "Slippage this low may make the transaction fail." }
      : value > highThreshold
        ? { tone: "warning" as const, text: "High slippage: the trade can be frontrun and fill at a worse price." }
        : null;

  function commit(text: string) {
    const bps = percentToBps(text);
    if (bps !== null && bps > 0 && bps <= max) onValueChange(bps);
    setDraft(null);
  }

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-foreground"
          >
            <Settings2 className="size-4" aria-hidden="true" />
            <span>
              <span className="sr-only">Slippage settings, </span>
              <span className="font-mono tabular-nums">{bpsToPercent(value)}%</span>
            </span>
          </button>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align={align} sideOffset={8} collisionPadding={12} asChild>
          <motion.div
            variants={overlayVariants(reduceMotion)}
            initial="hidden"
            animate="visible"
            className="z-50 w-72 origin-[var(--radix-popover-content-transform-origin)] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none"
          >
            <p id={`${id}-label`} className="text-sm font-semibold text-foreground">
              Max slippage
            </p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Your swap reverts if the price moves more than this.</p>
            <LayoutGroup id={id}>
              <div className="mt-3 flex gap-1 rounded-xl bg-muted p-1">
                <div role="radiogroup" aria-labelledby={`${id}-label`} className="flex flex-[3] gap-1">
                {presets.map((bps) => {
                  const active = bps === value && draft === null;
                  return (
                    <button
                      key={bps}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setDraft(null);
                        onValueChange(bps);
                      }}
                      className={cn(
                        "relative h-9 flex-1 cursor-pointer rounded-lg font-mono text-[13px] font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "text-foreground" : "text-foreground/65 hover:text-foreground",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="slippage-indicator"
                          transition={reduceMotion ? { duration: 0 } : spring.snappy}
                          className="absolute inset-0 rounded-lg bg-background shadow-xs"
                        />
                      ) : null}
                      <span className="relative">{bpsToPercent(bps)}%</span>
                    </button>
                  );
                })}
                </div>
                <label className="relative flex h-9 flex-[1.3] items-center rounded-lg">
                  {!isPreset && draft === null ? (
                    <motion.span
                      layoutId="slippage-indicator"
                      transition={reduceMotion ? { duration: 0 } : spring.snappy}
                      className="absolute inset-0 rounded-lg bg-background shadow-xs"
                    />
                  ) : null}
                  <span className="sr-only">Custom slippage percentage</span>
                  <input
                    value={shown}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={(event) => commit(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commit(event.currentTarget.value);
                    }}
                    inputMode="decimal"
                    placeholder="Custom"
                    aria-invalid={invalid || undefined}
                    className={cn(
                      "relative h-full w-full min-w-0 rounded-lg bg-transparent pr-6 pl-2.5 text-right font-mono text-[13px] font-medium tabular-nums outline-none placeholder:font-sans placeholder:text-foreground/50 focus:bg-background focus:ring-2 focus:ring-ring",
                      invalid ? "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]" : "text-foreground",
                    )}
                  />
                  <span className="pointer-events-none absolute right-2.5 text-[13px] text-muted-foreground" aria-hidden="true">
                    %
                  </span>
                </label>
              </div>
            </LayoutGroup>
            <AnimatePresence initial={false}>
              {warning ? (
                <motion.div
                  key={warning.text}
                  role="alert"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "mt-3 flex gap-2 rounded-lg p-2.5 text-xs leading-5 text-foreground",
                    warning.tone === "error" ? "bg-destructive/8" : "bg-warning/10",
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "mt-0.5 size-3.5 shrink-0",
                      warning.tone === "error"
                        ? "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]"
                        : "text-[color-mix(in_oklab,var(--warning)_55%,var(--foreground))]",
                    )}
                    aria-hidden="true"
                  />
                  {warning.text}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
