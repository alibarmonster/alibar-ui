"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { RollingDigits } from "@/components/ui/rolling-digits/rolling-digits";
import { formatDate } from "@/lib/markets/format";
import type { Market } from "@/lib/markets/types";
import { useNow } from "@/lib/markets/use-now";

export type ResolutionStage = "open" | "closed" | "resolving" | "resolved";

export interface ResolutionCardProps {
  /** The market (rules, resolution source, end time and the winning outcome once resolved). */
  market: Market;
  /** Where the market is in its lifecycle. @default "open" */
  stage?: ResolutionStage;
  /** When the dispute window closes, ms since epoch (shown while resolving). */
  disputeEndsAt?: number;
  /** Expected resolution time, ms since epoch. @default the end time plus a day */
  resolvesAt?: number;
  /** Classes for the card. */
  className?: string;
}

const STEPS: { id: ResolutionStage; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "closed", label: "Trading closed" },
  { id: "resolving", label: "Resolving" },
  { id: "resolved", label: "Resolved" },
];

/**
 * Status timeline (Open → Trading closed → Resolving → Resolved), expandable rules, the resolution
 * source and dates, a dispute countdown, and an outcome stamp with a glowing border on resolve.
 */
export function ResolutionCard({ market, stage = "open", disputeEndsAt, resolvesAt, className }: ResolutionCardProps) {
  const reduceMotion = useReducedMotion();
  const now = useNow();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [glow, setGlow] = useState(false);
  const current = STEPS.findIndex((s) => s.id === stage);
  const winner = market.outcomes.find((o) => o.id === market.resolvedOutcomeId);

  // A brief glow when the card reaches "resolved" (state set from timers, not during render).
  useEffect(() => {
    if (stage !== "resolved" || reduceMotion) return;
    const on = window.setTimeout(() => setGlow(true), 0);
    const off = window.setTimeout(() => setGlow(false), 1600);
    return () => {
      window.clearTimeout(on);
      window.clearTimeout(off);
    };
  }, [stage, reduceMotion]);

  const remaining = disputeEndsAt && now ? Math.max(0, disputeEndsAt - now) : 0;
  const days = Math.floor(remaining / 86400_000);
  const hours = Math.floor((remaining % 86400_000) / 3600_000);
  const minutes = Math.floor((remaining % 3600_000) / 60_000);

  return (
    <section aria-label="Resolution and rules" className={cn("relative w-full rounded-2xl border bg-background p-4 transition-[border-color,box-shadow] duration-700", glow ? "border-success shadow-[0_0_0_4px_color-mix(in_oklab,var(--success)_20%,transparent)]" : "border-border", className)}>
      <p className="text-sm font-medium text-foreground">Resolution</p>
      <ol className="mt-3 grid grid-cols-4 gap-1">
        {STEPS.map((step, i) => {
          const done = i < current || (stage === "resolved" && i === current);
          const active = i === current && stage !== "resolved";
          return (
            <li key={step.id} aria-current={i === current ? "step" : undefined} className="flex flex-col items-center gap-1.5 text-center">
              <span className="relative flex w-full items-center">
                <span className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : i <= current ? "bg-success" : "bg-border")} />
                <span className={cn("relative grid size-6 shrink-0 place-items-center rounded-full border-2", done ? "border-success bg-success text-white" : active ? "border-primary bg-background" : "border-border bg-background")}>
                  {active ? <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary opacity-60 motion-reduce:animate-none" /> : null}
                  {done ? (
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: i * 0.08 }} />
                    </svg>
                  ) : (
                    <span className={cn("size-1.5 rounded-full", active ? "bg-primary" : "bg-border")} />
                  )}
                </span>
                <span className={cn("h-0.5 flex-1", i === STEPS.length - 1 ? "opacity-0" : i < current ? "bg-success" : "bg-border")} />
              </span>
              <span className={cn("text-[11px] leading-tight", i <= current ? "font-medium text-foreground" : "text-muted-foreground")}>{step.label}</span>
            </li>
          );
        })}
      </ol>

      {stage === "resolved" ? (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-success/8 px-3 py-2.5">
          <p className="text-[13px] text-foreground">Final outcome</p>
          <motion.span
            initial={reduceMotion ? false : { scale: 1.7, rotate: -16, opacity: 0 }}
            animate={{ scale: 1, rotate: -6, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 17, delay: 0.2 }}
            className="rounded-md border-2 border-success px-2 py-0.5 text-[12px] font-bold tracking-wide text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))] uppercase"
          >
            Resolved: {winner?.name ?? "—"}
          </motion.span>
        </div>
      ) : null}

      {stage === "resolving" && disputeEndsAt ? (
        <div className="mt-4 rounded-xl border border-border bg-surface px-3 py-2.5">
          <p className="text-[12px] text-muted-foreground">Dispute window closes in</p>
          <p className="mt-0.5 flex items-baseline gap-1 text-lg font-semibold text-foreground tabular-nums" aria-label={now ? `${days} ${days === 1 ? "day" : "days"}, ${hours} ${hours === 1 ? "hour" : "hours"}, ${minutes} ${minutes === 1 ? "minute" : "minutes"}` : undefined}>
            {now ? (
              <>
                <RollingDigits value={days} decimals={0} />
                <span className="text-[12px] font-normal text-muted-foreground">d</span>
                <RollingDigits value={hours} decimals={0} />
                <span className="text-[12px] font-normal text-muted-foreground">h</span>
                <RollingDigits value={minutes} decimals={0} />
                <span className="text-[12px] font-normal text-muted-foreground">m</span>
              </>
            ) : (
              " "
            )}
          </p>
        </div>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <dt className="text-muted-foreground">Trading ends</dt>
          <dd className="font-medium text-foreground tabular-nums">{now ? formatDate(market.endsAt) : "\u00a0"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Resolves</dt>
          <dd className="font-medium text-foreground tabular-nums">{now ? formatDate(resolvesAt ?? market.endsAt + 86400_000) : "\u00a0"}</dd>
        </div>
      </dl>

      {market.rules ? (
        <div className="mt-4 border-t border-border pt-3">
          <button type="button" aria-expanded={rulesOpen} onClick={() => setRulesOpen((o) => !o)} className="flex w-full cursor-pointer items-center justify-between rounded-md text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Rules
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", rulesOpen && "rotate-180")} aria-hidden="true" />
          </button>
          <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none", rulesOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden" inert={!rulesOpen}>
              <p className="pt-2 text-[13px] leading-6 text-muted-foreground">{market.rules}</p>
              {market.resolutionSource ? (
                <a href={market.resolutionSource.href} className="mt-2 inline-flex items-center gap-1 rounded-sm text-[13px] font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                  {market.resolutionSource.label}
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
