"use client";

import { useEffect, useId, useState, type ComponentProps } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { RangeSlider } from "@/components/ui/range-slider/range-slider";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";
import { formatAmount, formatBps, formatUsd, percentOf, toUsd } from "@/lib/web3/format";
import { TokenIcon } from "@/lib/web3/icons";
import { RollingValue } from "@/lib/web3/rolling-value";
import type { Token } from "@/lib/web3/types";

export type StakingStatus = "idle" | "staking" | "unstaking" | "claiming" | "claimed";

export interface StakingCardProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Token being staked. Its price enables USD values. */
  token: Token;
  /** Annual yield in basis points (840 = 8.4%). */
  apyBps: number;
  /** Amount staked, in the token's smallest unit. */
  staked: bigint;
  /** Wallet balance available to stake. */
  balance: bigint;
  /** Pending rewards when this prop was last updated; the counter ticks up from here. */
  rewards: bigint;
  /** Reward token, when different from the staked token. */
  rewardToken?: Token;
  /** Lock terms shown under the title. @default "Unstake anytime" */
  lockLabel?: string;
  /** Action in progress. "claimed" plays the success burst. @default "idle" */
  status?: StakingStatus;
  /** Called with the amount to stake. */
  onStake?: (amount: bigint) => void;
  /** Called with the amount to unstake. */
  onUnstake?: (amount: bigint) => void;
  /** Called from the Claim button. */
  onClaim?: () => void;
}

const SECONDS_PER_YEAR = BigInt(31_536_000);
const PARTICLES = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2);

const Spinner = () => (
  <svg className="size-4 animate-spin motion-reduce:animate-pulse" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export function StakingCard({
  token,
  apyBps,
  staked,
  balance,
  rewards,
  rewardToken = token,
  lockLabel = "Unstake anytime",
  status = "idle",
  onStake,
  onUnstake,
  onClaim,
  className,
  ...props
}: StakingCardProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const id = useId();
  const [mode, setMode] = useState<"stake" | "unstake">("stake");
  const [percent, setPercent] = useState(50);
  const [elapsed, setElapsed] = useState(0);
  const [baseline, setBaseline] = useState(rewards);
  if (rewards !== baseline) {
    setBaseline(rewards);
    setElapsed(0);
  }

  useEffect(() => {
    if (staked === BigInt(0)) return;
    const timer = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [staked]);

  // Rewards accrue per second with bigint math: staked × APY ÷ seconds in a year.
  const perSecond = (staked * BigInt(apyBps)) / (BigInt(10000) * SECONDS_PER_YEAR);
  const liveRewards = rewards + perSecond * BigInt(elapsed);
  const max = mode === "stake" ? balance : staked;
  const amount = percent >= 100 ? max : percentOf(max, percent);
  const busy = status === "staking" || status === "unstaking";
  const usd = (value: bigint, t: Token) => (t.price !== undefined ? formatUsd(toUsd(value, t.decimals, t.price)) : null);

  return (
    <div className={cn("w-full max-w-sm rounded-3xl border border-border bg-background p-5 shadow-md", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <TokenIcon token={token} size={40} />
          <div>
            <p className="text-sm font-semibold text-foreground">Stake {token.symbol}</p>
            <p className="text-xs text-muted-foreground">{lockLabel}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 font-mono text-xs font-semibold text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))] tabular-nums">
          <Sparkles className="size-3" aria-hidden="true" />
          {formatBps(apyBps)} APY
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-2">
        {[
          { label: "Staked", value: staked },
          { label: "In wallet", value: balance },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-surface p-3">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="mt-0.5 font-mono text-sm font-medium text-foreground tabular-nums">
              {formatAmount(item.value, token.decimals, { maxFractionDigits: 2 })} {token.symbol}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border p-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Rewards</p>
          <p className="font-mono text-base font-semibold text-foreground tabular-nums">
            <RollingValue value={formatAmount(liveRewards, rewardToken.decimals, { maxFractionDigits: 4, minFractionDigits: 4 })} flash={false} />{" "}
            <span className="font-sans text-xs font-medium text-muted-foreground">{rewardToken.symbol}</span>
          </p>
        </div>
        <div className="relative">
          <AnimatePresence>
            {status === "claimed" && !reduceMotion
              ? PARTICLES.map((angle, i) => (
                  <motion.span
                    key={`p${i}`}
                    aria-hidden="true"
                    className={cn("pointer-events-none absolute top-1/2 left-1/2 size-1.5 rounded-full", i % 2 ? "bg-success" : "bg-primary")}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ x: Math.cos(angle) * 34, y: Math.sin(angle) * 26, opacity: 0, scale: 0.4 }}
                    transition={{ duration: 0.7, ease: ease.out }}
                  />
                ))
              : null}
          </AnimatePresence>
          <button
            type="button"
            onClick={onClaim}
            disabled={status === "claiming" || status === "claimed" || liveRewards === BigInt(0)}
            className={cn(
              "relative inline-flex h-9 min-w-24 cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-full px-4 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default",
              status === "claimed" ? "bg-success text-white" : "bg-foreground text-background enabled:hover:bg-foreground/90 disabled:opacity-60",
            )}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={status === "claimed" ? "done" : status === "claiming" ? "busy" : "idle"}
                className="flex items-center gap-1.5"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(3px)" }}
                transition={{ duration: duration.quick, ease: ease.out }}
              >
                {status === "claimed" ? (
                  <>
                    <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                    Claimed
                  </>
                ) : status === "claiming" ? (
                  <>
                    <Spinner />
                    Claiming
                  </>
                ) : (
                  "Claim"
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <LayoutGroup id={id}>
        <div role="tablist" aria-label="Action" className="mt-5 flex gap-1 rounded-xl bg-muted p-1">
          {(["stake", "unstake"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={mode === option}
              aria-controls={`${id}-panel`}
              onClick={() => setMode(option)}
              className={cn(
                "relative h-9 flex-1 cursor-pointer rounded-lg text-[13px] font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mode === option ? "text-foreground" : "text-foreground/60 hover:text-foreground",
              )}
            >
              {mode === option ? (
                <motion.span layoutId="stake-tab" transition={reduceMotion ? { duration: 0 } : spring.snappy} className="absolute inset-0 rounded-lg bg-background shadow-xs" />
              ) : null}
              <span className="relative">{option}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      <div id={`${id}-panel`} role="tabpanel" aria-label={mode === "stake" ? "Stake" : "Unstake"} className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {formatAmount(amount, token.decimals, { maxFractionDigits: 2 })}
            <span className="ml-1.5 font-sans text-sm font-medium text-muted-foreground">{token.symbol}</span>
          </p>
          <p className="font-mono text-xs text-muted-foreground tabular-nums">{usd(amount, token) ?? ""}</p>
        </div>
        <RangeSlider
          className="mt-3"
          value={[percent]}
          onValueChange={([v]) => setPercent(v)}
          min={0}
          max={100}
          step={1}
          ticks={false}
          formatValue={(v) => `${v}%`}
          thumbLabels={[mode === "stake" ? "Share of wallet balance to stake" : "Share of stake to withdraw"]}
          disabled={max === BigInt(0) || busy}
        />
        <button
          type="button"
          disabled={amount === BigInt(0) || busy}
          aria-busy={busy || undefined}
          onClick={() => (mode === "stake" ? onStake?.(amount) : onUnstake?.(amount))}
          className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-foreground text-sm font-semibold text-background outline-none transition-colors enabled:hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          {busy ? <Spinner /> : null}
          {status === "staking"
            ? "Staking…"
            : status === "unstaking"
              ? "Unstaking…"
              : amount === BigInt(0)
                ? max === BigInt(0)
                  ? mode === "stake"
                    ? `No ${token.symbol} to stake`
                    : "Nothing staked"
                  : "Choose an amount"
                : `${mode === "stake" ? "Stake" : "Unstake"} ${formatAmount(amount, token.decimals, { maxFractionDigits: 2 })} ${token.symbol}`}
        </button>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {status === "claimed" ? "Rewards claimed" : busy ? (status === "staking" ? "Staking" : "Unstaking") : ""}
      </span>
    </div>
  );
}
