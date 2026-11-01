"use client";

import { useState, type ComponentProps } from "react";
import { DropdownMenu } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeftRight, ArrowUpRight, Check, ChevronDown, Clock3, X } from "lucide-react";
import { TokenAmountInput } from "@/components/ui/token-amount-input/token-amount-input";
import { cn } from "@/lib/utils";
import { duration, ease, overlayVariants, spring } from "@/lib/motion";
import { formatAmount, parseAmount } from "@/lib/web3/format";
import { ChainIcon } from "@/lib/web3/icons";
import { explorerLink, type Chain, type Token } from "@/lib/web3/types";

export interface BridgeQuote {
  /** Amount received on the destination chain, in the token's smallest unit. */
  receive: bigint;
  /** Estimated transfer time in seconds. */
  etaSeconds: number;
  /** Fee lines, pre-formatted, e.g. { label: "Bridge fee", value: "0.0008 ETH" }. */
  fees: { label: string; value: string }[];
}

export type BridgeStatus = "idle" | "awaiting-signature" | "sending" | "bridging" | "complete" | "failed";

export interface BridgeWidgetProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Chains the bridge connects. */
  chains: Chain[];
  /** Token being bridged. */
  token: Token;
  /** Token balance per chain id, in the token's smallest unit. */
  balances?: Record<number, bigint>;
  /** Initial source chain id. @default chains[0] */
  defaultFromChainId?: number;
  /** Initial destination chain id. @default chains[1] */
  defaultToChainId?: number;
  /** Initial amount text. @default "" */
  defaultAmount?: string;
  /** Returns a quote for a route and amount. */
  getQuote?: (from: Chain, to: Chain, amount: bigint) => BridgeQuote | null;
  /** Transfer lifecycle; anything but "idle" shows the progress tracker. @default "idle" */
  status?: BridgeStatus;
  /** Bridging progress from 0 to 1, shown while status is "bridging". */
  progress?: number;
  /** Called from the Bridge button. */
  onBridge?: (transfer: { from: Chain; to: Chain; amount: bigint; quote: BridgeQuote }) => void;
  /** Called from "Bridge more" or "Try again"; reset status to "idle" here. */
  onReset?: () => void;
  /** Source transaction hash, linked from the tracker. */
  txHash?: string;
  /** Reason shown when status is "failed". @default "The transfer didn't go through." */
  error?: string;
}

const formatEta = (s: number) => (s < 90 ? `~${s}s` : `~${Math.round(s / 60)} min`);

function ChainPicker({ label, chain, chains, exclude, onPick }: { label: string; chain: Chain; chains: Chain[]; exclude: number; onPick: (id: number) => void }) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="group flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-2 rounded-2xl p-3 outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring">
        <ChainIcon chain={chain} size={40} />
        <span className="text-center">
          <span className="block text-[11px] text-muted-foreground">{label}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
            {chain.shortName ?? chain.name}
            <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
          </span>
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content sideOffset={6} collisionPadding={12} asChild>
          <motion.div
            variants={overlayVariants(reduceMotion)}
            initial="hidden"
            animate="visible"
            className="z-50 w-52 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-xl border border-border bg-popover p-1.5 shadow-lg outline-none"
          >
            <DropdownMenu.RadioGroup value={String(chain.id)} onValueChange={(v) => onPick(Number(v))}>
              {chains.map((c) => (
                <DropdownMenu.RadioItem
                  key={c.id}
                  value={String(c.id)}
                  disabled={c.id === exclude}
                  className="flex h-10 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-sm text-foreground outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[highlighted]:bg-accent"
                >
                  <ChainIcon chain={c} size={20} />
                  <span className="flex-1">{c.name}</span>
                  {c.id === chain.id ? <Check className="size-4" aria-hidden="true" /> : null}
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          </motion.div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function BridgeWidget({
  chains,
  token,
  balances = {},
  defaultFromChainId,
  defaultToChainId,
  defaultAmount = "",
  getQuote,
  status = "idle",
  progress = 0,
  onBridge,
  onReset,
  txHash,
  error = "The transfer didn't go through.",
  className,
  ...props
}: BridgeWidgetProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [fromId, setFromId] = useState(defaultFromChainId ?? chains[0]?.id);
  const [toId, setToId] = useState(defaultToChainId ?? chains[1]?.id);
  const [amount, setAmount] = useState(defaultAmount);
  const [turns, setTurns] = useState(0);
  const from = chains.find((c) => c.id === fromId) ?? chains[0];
  const to = chains.find((c) => c.id === toId) ?? chains[1];
  const parsed = parseAmount(amount, token.decimals);
  const balance = balances[from.id];
  const insufficient = parsed !== null && balance !== undefined && parsed > balance;
  const quote = parsed && parsed > BigInt(0) && getQuote ? getQuote(from, to, parsed) : null;
  const tracking = status !== "idle";
  const active = status === "bridging";

  const button = !parsed
    ? { label: "Enter an amount", disabled: true }
    : insufficient
      ? { label: `Insufficient ${token.symbol} on ${from.shortName ?? from.name}`, disabled: true, error: true }
      : !quote
        ? { label: "No route available", disabled: true }
        : { label: `Bridge to ${to.shortName ?? to.name}`, disabled: false };

  const steps = [
    { key: "awaiting-signature", label: "Confirm in your wallet" },
    { key: "sending", label: `Send on ${from.shortName ?? from.name}` },
    { key: "bridging", label: "Bridging" },
    { key: "complete", label: `Receive on ${to.shortName ?? to.name}` },
  ];
  const order = ["awaiting-signature", "sending", "bridging", "complete"];
  const [failedAt, setFailedAt] = useState(0);
  const [lastStatus, setLastStatus] = useState(status);
  if (status !== lastStatus) {
    if (status === "failed") setFailedAt(Math.max(0, order.indexOf(lastStatus)));
    setLastStatus(status);
  }
  const currentIndex = status === "failed" ? failedAt : status === "complete" ? order.length : order.indexOf(status);
  const href = txHash ? explorerLink(from.explorerUrl, "tx", txHash) : undefined;

  const swap = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 10, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -6, filter: "blur(4px)" },
      };

  return (
    <motion.div
      layout
      transition={{ layout: reduceMotion ? { duration: 0 } : spring.smooth }}
      style={{ borderRadius: 24 }}
      className={cn("w-full max-w-md overflow-hidden border border-border bg-background p-2 shadow-md", className)}
      {...props}
    >
      <div className="flex h-11 items-center px-3">
        <p className="text-sm font-semibold text-foreground">Bridge {token.symbol}</p>
      </div>

      <div className="flex items-center gap-1 rounded-2xl border border-border bg-background px-1">
        <ChainPicker label="From" chain={from} chains={chains} exclude={to.id} onPick={setFromId} />
        <div className="relative flex w-24 shrink-0 items-center justify-center self-stretch" aria-hidden={tracking}>
          <svg viewBox="0 0 96 40" className="absolute inset-x-0 top-1/2 h-10 w-full -translate-y-1/2" aria-hidden="true">
            <path d="M4 26 C 30 4, 66 4, 92 26" fill="none" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" />
            <motion.path
              d="M4 26 C 30 4, 66 4, 92 26"
              fill="none"
              stroke={active ? "var(--primary)" : "var(--muted-foreground)"}
              strokeOpacity={active ? 1 : 0.55}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="3 9"
              animate={{ strokeDashoffset: [0, -24] }}
              transition={{ duration: active ? 0.5 : 1.4, ease: "linear", repeat: reduceMotion ? 0 : Infinity }}
            />
          </svg>
          <motion.button
            type="button"
            onClick={() => {
              setTurns(turns + 1);
              setFromId(to.id);
              setToId(from.id);
            }}
            disabled={tracking}
            aria-label={`Swap direction: bridge from ${to.name} to ${from.name}`}
            animate={{ rotate: turns * 180 }}
            transition={reduceMotion ? { duration: 0 } : spring.snappy}
            className="relative z-10 mt-6 grid size-9 cursor-pointer place-items-center rounded-full border border-border bg-background text-foreground shadow-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeftRight className="size-4" aria-hidden="true" />
          </motion.button>
        </div>
        <ChainPicker label="To" chain={to} chains={chains} exclude={from.id} onPick={setToId} />
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        {!tracking ? (
          <motion.div key="form" variants={swap} initial="initial" animate="animate" exit="exit" transition={{ duration: duration.base, ease: ease.out }}>
            <TokenAmountInput
              className="mt-1.5"
              label={`Send from ${from.shortName ?? from.name}`}
              token={token}
              balance={balance}
              value={amount}
              onValueChange={(text) => setAmount(text)}
            />
            {quote ? (
              <div className="mt-2 rounded-2xl bg-surface p-3.5 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">You receive</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    ≈ {formatAmount(quote.receive, token.decimals, { maxFractionDigits: 6 })} {token.symbol}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Arrives in</span>
                  <span className="flex items-center gap-1 font-mono text-foreground tabular-nums">
                    <Clock3 className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    {formatEta(quote.etaSeconds)}
                  </span>
                </div>
                <dl className="mt-2.5 space-y-1 border-t border-border pt-2.5 text-xs">
                  {quote.fees.map((fee) => (
                    <div key={fee.label} className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{fee.label}</dt>
                      <dd className="font-mono text-foreground tabular-nums">{fee.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
            <button
              type="button"
              disabled={button.disabled}
              onClick={() => quote && parsed && onBridge?.({ from, to, amount: parsed, quote })}
              className={cn(
                "mt-2 flex h-13 w-full cursor-pointer items-center justify-center rounded-2xl text-[15px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                button.error
                  ? "bg-destructive/10 text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]"
                  : button.disabled
                    ? "bg-muted text-muted-foreground"
                    : "bg-foreground text-background hover:bg-foreground/90",
              )}
            >
              {button.label}
            </button>
          </motion.div>
        ) : (
          <motion.div key="tracker" variants={swap} initial="initial" animate="animate" exit="exit" transition={{ duration: duration.base, ease: ease.out }} className="px-3 pt-4 pb-2">
            <p className="text-sm font-semibold text-foreground">
              {status === "complete" ? "Transfer complete" : status === "failed" ? "Transfer failed" : `Bridging ${parsed ? formatAmount(parsed, token.decimals) : ""} ${token.symbol}`}
            </p>
            <ol className="mt-4 space-y-0">
              {steps.map((step, index) => {
                const done = index < currentIndex;
                const current = index === currentIndex && status !== "complete";
                const failed = current && status === "failed";
                return (
                  <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < steps.length - 1 ? (
                      <span className="absolute top-7 bottom-0 left-[13px] w-0.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
                        <motion.span
                          className="absolute inset-0 origin-top bg-success"
                          initial={false}
                          animate={{ scaleY: done ? 1 : 0 }}
                          transition={{ duration: reduceMotion ? 0 : 0.4, ease: ease.out }}
                        />
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "relative grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
                        done && "border-success bg-success text-white",
                        failed && "border-destructive bg-destructive text-white",
                        current && !failed && "border-primary text-primary",
                        !done && !current && "border-border text-muted-foreground",
                      )}
                      aria-hidden="true"
                    >
                      {done ? (
                        <Check className="size-3.5" strokeWidth={3} />
                      ) : failed ? (
                        <X className="size-3.5" strokeWidth={3} />
                      ) : current ? (
                        <svg className="size-3.5 animate-spin motion-reduce:animate-pulse" viewBox="0 0 24 24" fill="none">
                          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <span className="font-mono text-[11px]">{index + 1}</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className={cn("text-sm", done || current ? "font-medium text-foreground" : "text-muted-foreground")}>
                        {step.label}
                        <span className="sr-only">{done ? ", done" : failed ? ", failed" : current ? ", in progress" : ", waiting"}</span>
                      </p>
                      {step.key === "bridging" && current && !failed ? (
                        <div className="mt-2">
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full origin-left rounded-full bg-primary transition-transform duration-500 ease-out motion-reduce:transition-none"
                              style={{ transform: `scaleX(${Math.min(1, Math.max(0.02, progress))})` }}
                            />
                          </div>
                          <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
                            {Math.round(progress * 100)}%{quote ? ` · ${formatEta(Math.max(5, Math.round(quote.etaSeconds * (1 - progress))))} left` : ""}
                          </p>
                        </div>
                      ) : null}
                      {failed ? <p className="mt-1 text-xs text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]">{error}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 flex items-center justify-between gap-3">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded text-[13px] font-medium text-foreground underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  View source transaction
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              ) : (
                <span />
              )}
              {status === "complete" || status === "failed" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (status === "complete") setAmount("");
                    onReset?.();
                  }}
                  className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-foreground px-3.5 text-[13px] font-medium text-background outline-none hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {status === "complete" ? "Bridge more" : "Try again"}
                </button>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only" role="status" aria-live="polite">
        {tracking ? (status === "complete" ? "Transfer complete" : status === "failed" ? `Transfer failed. ${error}` : steps[currentIndex]?.label ?? "") : ""}
      </span>
    </motion.div>
  );
}
