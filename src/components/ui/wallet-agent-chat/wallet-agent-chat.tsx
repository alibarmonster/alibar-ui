"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowRight, ExternalLink, RotateCcw, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, spring, stagger } from "@/lib/motion";
import { AddressPill } from "@/components/ui/address-pill/address-pill";
import { AgentSteps, type AgentStep } from "@/components/ui/agent-steps/agent-steps";
import { AIPromptInput } from "@/components/ui/ai-prompt-input/ai-prompt-input";
import { StreamingText, useTextStream } from "@/components/ui/streaming-text/streaming-text";
import { SimulatedBadge } from "@/lib/markets/avatar";
import { AddressAvatar, TokenIcon } from "@/lib/web3/icons";
import { formatAmount, formatBps, formatUsd, toUsd, truncateAddress } from "@/lib/web3/format";
import { RollingValue } from "@/lib/web3/rolling-value";
import { explorerLink } from "@/lib/web3/types";
import {
  quoteSwap,
  useMockWalletAgent,
  type AgentActionCard,
  type AgentContact,
  type AgentReply,
  type AgentToken,
  type WalletAgent,
} from "@/lib/usage/wallet-agent";

export interface StarterPrompt {
  /** Card title, e.g. "Swap tokens". */
  title: string;
  /** The prompt sent when the card is picked. */
  prompt: string;
}

export interface WalletAgentChatProps {
  /** Name shown in the header. @default "Atlas" */
  agentName?: string;
  /** The connected address. */
  address: string;
  /** Total wallet value in USD as a bigint with 8 decimals (USD_DECIMALS). Confirmed actions roll it down. */
  balanceUsd: bigint;
  /** Saved contacts the agent may pay. */
  contacts: AgentContact[];
  /** Tokens in the wallet with balances and USD prices. */
  tokens: AgentToken[];
  /** Up to three prompt cards for the empty state. */
  starterPrompts?: StarterPrompt[];
  /** The agent that answers prompts. @default a scripted agent from useMockWalletAgent */
  agent?: WalletAgent;
  /**
   * Called when a card is approved. Return a promise to hold the card at "Awaiting signature" until it
   * settles; resolve with a transaction hash, or reject to show the failed state.
   */
  onApprove?: (card: AgentActionCard) => Promise<string | void> | void;
  /** Called when a card is cancelled before signing. */
  onReject?: (card: AgentActionCard) => void;
  /** Block explorer base URL for the confirmed link, e.g. "https://etherscan.io". */
  explorerUrl?: string;
  /** Show the "Simulated" badge. @default true */
  simulated?: boolean;
  /** Classes for the chat. */
  className?: string;
}

type CardStatus = "review" | "awaiting-signature" | "pending" | "confirmed" | "failed" | "cancelled";

type Message = { id: string; role: "user"; text: string } | { id: string; role: "agent"; reply: AgentReply };

const STEP_MS = 650;
const PENDING_MS = 2400;
const QUOTE_SECONDS = 15;

const usdOf = (token: AgentToken, amount: bigint) => toUsd(amount, token.decimals, token.price);
const amountText = (token: AgentToken, amount: bigint) => `${formatAmount(amount, token.decimals)} ${token.symbol}`;

/** What a confirmed card takes off the wallet's USD total. */
function costOf(card: AgentActionCard) {
  if (card.kind === "send") return usdOf(card.token, card.amount) + card.networkFeeUsd;
  if (card.kind === "swap") return usdOf(card.from, card.amountIn) - usdOf(card.to, card.amountOut) + card.networkFeeUsd;
  return card.networkFeeUsd;
}

function fakeHash(seed: string) {
  let out = "";
  for (let round = 0; out.length < 64; round++) {
    let hash = 0x811c9dc5;
    for (const char of `${round}:${seed}`) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
    hash ^= hash >>> 13;
    out += (hash >>> 0).toString(16).padStart(8, "0");
  }
  return `0x${out.slice(0, 64)}`;
}

const button = "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function Row({ label, children, strong }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right font-mono tabular-nums", strong ? "font-semibold text-foreground" : "text-foreground")}>{children}</dd>
    </div>
  );
}

/** A small ring that empties over the quote's lifetime. */
function QuoteRing({ seconds }: { seconds: number }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 18 18" className="size-4 -rotate-90" aria-hidden="true">
      <circle cx="9" cy="9" r={r} fill="none" stroke="var(--border)" strokeWidth="2" />
      <circle cx="9" cy="9" r={r} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - seconds / QUOTE_SECONDS)} className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
    </svg>
  );
}

function ActionCard({
  card: initial,
  onApprove,
  onReject,
  onStatus,
  explorerUrl,
}: {
  card: AgentActionCard;
  onApprove?: WalletAgentChatProps["onApprove"];
  onReject?: WalletAgentChatProps["onReject"];
  onStatus: (card: AgentActionCard, status: CardStatus) => void;
  explorerUrl?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [card, setCard] = useState(initial);
  const [status, setStatus] = useState<CardStatus>("review");
  const [hash, setHash] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(QUOTE_SECONDS);
  const [progress, setProgress] = useState(0);
  const [scope, animate] = useAnimate<HTMLElement>();
  const left = useRef(QUOTE_SECONDS);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const update = (next: CardStatus, current = card) => {
    setStatus(next);
    onStatus(current, next);
  };

  // The swap quote counts down while under review and re-rolls when it runs out.
  useEffect(() => {
    if (card.kind !== "swap" || status !== "review") return;
    const timer = window.setInterval(() => {
      left.current -= 1;
      if (left.current <= 0) {
        left.current = QUOTE_SECONDS;
        // A refreshed quote lands within ±0.2% of the last one.
        const jitter = Math.round((Math.random() - 0.5) * 40);
        setCard((c) => {
          if (c.kind !== "swap") return c;
          const quote = quoteSwap(c.from, c.to, c.amountIn, jitter);
          return { ...c, amountOut: quote.amountOut, priceImpactBps: quote.priceImpactBps };
        });
      }
      setSeconds(left.current);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [card.kind, status]);

  // Pending fills a progress ring, then confirms.
  useEffect(() => {
    if (status !== "pending") return;
    const started = performance.now();
    let frame = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - started) / PENDING_MS);
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(tick);
      else if (live.current) update("confirmed");
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per pending phase
  }, [status]);

  const approve = async () => {
    const signed = card;
    setError("");
    update("awaiting-signature", signed);
    try {
      const started = Date.now();
      const result = await onApprove?.(signed);
      // A simulated wallet takes a moment to "sign".
      const wait = Math.max(0, 1100 - (Date.now() - started));
      await new Promise((resolve) => window.setTimeout(resolve, wait));
      if (!live.current) return;
      setHash(typeof result === "string" ? result : fakeHash(signed.id));
      setProgress(0);
      update("pending", signed);
    } catch (reason) {
      if (!live.current) return;
      setError(reason instanceof Error ? reason.message : "The transaction was not signed.");
      update("failed", signed);
      if (!reduceMotion && scope.current) animate(scope.current, { x: [0, -8, 7, -5, 3, 0] }, { duration: 0.4 });
    }
  };

  const cancel = () => {
    update("cancelled");
    onReject?.(card);
  };

  const title = card.kind === "swap" ? "Swap" : card.kind === "send" ? "Send" : "Token approval";
  const verb = card.kind === "swap" ? "Confirm swap" : card.kind === "send" ? `Send ${card.token.symbol}` : "Approve";
  const signing = status === "awaiting-signature";
  const done = status === "confirmed";
  const href = hash ? explorerLink(explorerUrl, "tx", hash) : undefined;
  const ring = 2 * Math.PI * 9;

  return (
    <motion.article
      ref={scope}
      aria-label={`${title} review`}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? { duration: duration.base } : spring.smooth}
      className={cn(
        "mt-3 w-full max-w-sm rounded-2xl border bg-background p-4 shadow-sm transition-colors",
        status === "failed" ? "border-destructive/40" : done ? "border-success/40" : "border-border",
        status === "cancelled" && "opacity-60",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        <span
          className={cn(
            "inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium",
            status === "review" && "bg-surface-2 text-foreground",
            signing && "bg-primary/10 text-primary",
            status === "pending" && "bg-warning/12 text-[color-mix(in_oklab,var(--warning)_65%,var(--foreground))]",
            done && "bg-success/12 text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]",
            status === "failed" && "bg-destructive/10 text-destructive",
            status === "cancelled" && "bg-surface-2 text-muted-foreground",
          )}
        >
          {status === "review" ? "Review" : signing ? "Awaiting signature" : status === "pending" ? "Pending" : done ? "Confirmed" : status === "failed" ? "Failed" : "Cancelled"}
        </span>
      </header>

      {/* Body */}
      {card.kind === "swap" ? (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2.5 rounded-xl bg-surface p-2.5">
            <TokenIcon token={card.from} size={28} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">You pay</p>
              <p className="font-mono text-[15px] font-semibold text-foreground tabular-nums">{amountText(card.from, card.amountIn)}</p>
            </div>
            <span className="font-mono text-[12px] text-muted-foreground tabular-nums">{formatUsd(usdOf(card.from, card.amountIn))}</span>
          </div>
          <div className="relative -my-3 flex justify-center">
            <span className="z-10 grid size-7 place-items-center rounded-full border border-border bg-background text-muted-foreground">
              <ArrowDown className="size-3.5" aria-hidden="true" />
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-surface p-2.5">
            <TokenIcon token={card.to} size={28} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">You receive about</p>
              <p className="font-mono text-[15px] font-semibold text-foreground">
                <RollingValue value={formatAmount(card.amountOut, card.to.decimals)} trend={card.amountOut} /> {card.to.symbol}
              </p>
            </div>
            <span className="font-mono text-[12px] text-muted-foreground tabular-nums">{formatUsd(usdOf(card.to, card.amountOut))}</span>
          </div>
        </div>
      ) : card.kind === "send" ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-surface p-2.5">
            <AddressAvatar address={card.to.address} size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-foreground">{card.to.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground" title={card.to.address}>
                {truncateAddress(card.to.address)}
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground">Saved contact</span>
          </div>
          <div className="flex items-center gap-2.5 px-1">
            <TokenIcon token={card.token} size={24} />
            <p className="flex-1 font-mono text-[15px] font-semibold text-foreground tabular-nums">{amountText(card.token, card.amount)}</p>
            <span className="font-mono text-[12px] text-muted-foreground tabular-nums">{formatUsd(usdOf(card.token, card.amount))}</span>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-surface p-2.5">
            <TokenIcon token={card.token} size={28} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">Allow spending up to</p>
              <p className="font-mono text-[15px] font-semibold text-foreground tabular-nums">{card.amount === null ? `Unlimited ${card.token.symbol}` : amountText(card.token, card.amount)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-1 text-[12px]">
            <span className="text-muted-foreground">Spender</span>
            <span className="ml-auto font-medium text-foreground">{card.spender.name}</span>
            <span className="font-mono text-muted-foreground" title={card.spender.address}>
              {truncateAddress(card.spender.address)}
            </span>
          </div>
          {card.amount === null ? (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-warning/35 bg-warning/10 p-2.5 text-[12px] text-[color-mix(in_oklab,var(--warning)_60%,var(--foreground))]">
              <ShieldAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-medium">Unlimited allowance</p>
                <p className="mt-0.5 opacity-90">{card.spender.name} could move every {card.token.symbol} you hold, now or later.</p>
                {status === "review" ? (
                  <button
                    type="button"
                    onClick={() => setCard({ ...card, amount: card.token.balance })}
                    className="mt-1.5 cursor-pointer rounded font-semibold underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Cap at your balance ({amountText(card.token, card.token.balance)})
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <dl className="mt-3 space-y-1 border-t border-border pt-3">
        {card.kind === "swap" ? (
          <>
            <Row label="Rate">
              1 {card.from.symbol} ≈ {formatAmount(card.amountIn > BigInt(0) ? (card.amountOut * BigInt(10) ** BigInt(card.from.decimals)) / card.amountIn : BigInt(0), card.to.decimals)} {card.to.symbol}
            </Row>
            <Row label="Route">{card.route.join(" → ")}</Row>
            <Row label="Fees">
              {formatBps(card.feeBps)} · impact{" "}
              <span className={cn(card.priceImpactBps >= 300 && "text-destructive")}>{formatBps(card.priceImpactBps)}</span>
            </Row>
          </>
        ) : null}
        <Row label="Network fee">{formatUsd(card.networkFeeUsd)}</Row>
        {card.kind === "send" ? <Row label="Total" strong>{formatUsd(usdOf(card.token, card.amount) + card.networkFeeUsd)}</Row> : null}
      </dl>

      {card.kind === "swap" && status === "review" ? (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <QuoteRing seconds={seconds} />
          Quote refreshes in <span className="font-mono tabular-nums">{seconds}s</span>
        </p>
      ) : null}

      {/* Lifecycle */}
      <div className="mt-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {status === "review" || status === "awaiting-signature" ? (
            <motion.div key="actions" className="flex gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: duration.quick }}>
              <button type="button" onClick={cancel} className={cn(button, "border border-border text-foreground hover:bg-surface-2")}>
                Cancel
              </button>
              <button type="button" onClick={approve} disabled={signing} aria-busy={signing} className={cn(button, "flex-1 bg-foreground text-background")}>
                {signing ? (
                  <>
                    <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background motion-reduce:animate-none" />
                    Check your wallet…
                  </>
                ) : (
                  verb
                )}
              </button>
            </motion.div>
          ) : status === "pending" ? (
            <motion.div key="pending" className="flex items-center gap-2.5 text-[12px] text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <svg viewBox="0 0 22 22" className="size-5 -rotate-90" role="progressbar" aria-label="Confirming" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <circle cx="11" cy="11" r="9" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                <circle cx="11" cy="11" r="9" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - progress)} />
              </svg>
              Waiting for confirmation…
              <span className="ml-auto font-mono">{truncateAddress(hash, { start: 8, end: 4 })}</span>
            </motion.div>
          ) : done ? (
            <motion.div key="done" className="flex items-center gap-2 text-[12px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <svg viewBox="0 0 22 22" className="size-5" aria-hidden="true">
                <circle cx="11" cy="11" r="10" fill="color-mix(in oklab, var(--success) 14%, transparent)" />
                <motion.path d="M6.5 11.5l3 3 6-6.5" fill="none" stroke="color-mix(in oklab, var(--success) 80%, var(--foreground))" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduceMotion ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: duration.slow, ease: ease.out }} />
              </svg>
              <span className="font-medium text-foreground">Confirmed</span>
              {href ? (
                <a href={href} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 rounded font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                  View on explorer <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              ) : (
                <span className="ml-auto font-mono text-muted-foreground">{truncateAddress(hash, { start: 8, end: 4 })}</span>
              )}
            </motion.div>
          ) : status === "failed" ? (
            <motion.div key="failed" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="flex-1 text-[12px] text-destructive">{error}</p>
              <button type="button" onClick={cancel} className={cn(button, "h-8 border border-border px-3 text-foreground hover:bg-surface-2")}>
                Dismiss
              </button>
              <button type="button" onClick={approve} className={cn(button, "h-8 bg-foreground px-3 text-background")}>
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Retry
              </button>
            </motion.div>
          ) : (
            <motion.p key="cancelled" className="text-[12px] text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Cancelled. Nothing was signed.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

function AgentMessage({
  reply,
  instant,
  onSettled,
  onStatus,
  onApprove,
  onReject,
  explorerUrl,
}: {
  reply: AgentReply;
  instant: boolean;
  onSettled: () => void;
  onStatus: (card: AgentActionCard, status: CardStatus) => void;
  onApprove?: WalletAgentChatProps["onApprove"];
  onReject?: WalletAgentChatProps["onReject"];
  explorerUrl?: string;
}) {
  const [done, setDone] = useState(0);
  const stepsDone = instant || done >= reply.steps.length;
  const stream = useTextStream(reply.text, { enabled: stepsDone && !instant, wordsPerSecond: 40 });
  const text = instant ? reply.text : stream.text;
  const finished = stepsDone && text.length >= reply.text.length;
  const settled = useRef(false);

  useEffect(() => {
    if (stepsDone) return;
    const timer = window.setTimeout(() => setDone((d) => d + 1), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [done, stepsDone]);

  useEffect(() => {
    if (finished && !settled.current) {
      settled.current = true;
      onSettled();
    }
  }, [finished, onSettled]);

  const steps: AgentStep[] = reply.steps.map((title, i) => ({ id: `${i}`, title, status: stepsDone || i < done ? "done" : i === done ? "running" : "pending" }));

  return (
    <div className="flex gap-2.5">
      <span aria-hidden="true" className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-background">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <AgentSteps steps={steps} aria-label="Agent steps" className="[&_li]:pb-2.5" />
        {stepsDone ? <StreamingText text={text} streaming={!finished} className="mt-2 text-[14px] leading-6 text-foreground" /> : null}
        {finished && reply.card ? <ActionCard card={reply.card} onApprove={onApprove} onReject={onReject} onStatus={onStatus} explorerUrl={explorerUrl} /> : null}
      </div>
    </div>
  );
}

/**
 * An AI wallet assistant that answers with transaction cards the user reviews and approves in place.
 * Each reply resolves its tool steps, streams its text, then slides in a swap, send or approval card
 * that tracks Review → Awaiting signature → Pending → Confirmed or Failed. Nothing is signed until the
 * user approves, and cancel is always available before signing.
 */
export function WalletAgentChat({
  agentName = "Atlas",
  address,
  balanceUsd,
  contacts,
  tokens,
  starterPrompts = [],
  agent,
  onApprove,
  onReject,
  explorerUrl,
  simulated = true,
  className,
}: WalletAgentChatProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const fallback = useMockWalletAgent({ tokens, contacts });
  const responder = agent ?? fallback;
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [instant, setInstant] = useState<Record<string, boolean>>({});
  const [spent, setSpent] = useState(BigInt(0));
  const [announce, setAnnounce] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const counter = useRef(0);

  // Keep the newest content in view as the conversation grows.
  useLayoutEffect(() => {
    const el = scroller.current;
    const inner = list.current;
    if (!el || !inner) return;
    const observer = new ResizeObserver(() => el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" }));
    observer.observe(inner);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const send = (prompt: string) => {
    const text = prompt.trim();
    if (!text || busy) return;
    const n = counter.current++;
    const reply = responder.respond(text);
    setMessages((m) => [...m, { id: `u${n}`, role: "user", text }, { id: `a${n}`, role: "agent", reply }]);
    setBusy(true);
  };

  const lastAgent = [...messages].reverse().find((m): m is Extract<Message, { role: "agent" }> => m.role === "agent");
  const settle = (message: Extract<Message, { role: "agent" }>) => () => {
    setBusy(false);
    setAnnounce(`${agentName}: ${message.reply.text}${message.reply.card ? " A card is ready to review." : ""}`);
  };

  const onStatus = (card: AgentActionCard, status: CardStatus) => {
    const label = card.kind === "swap" ? "Swap" : card.kind === "send" ? "Payment" : "Approval";
    if (status === "confirmed") setSpent((s) => s + costOf(card));
    const words: Partial<Record<CardStatus, string>> = { "awaiting-signature": "awaiting signature", pending: "pending", confirmed: "confirmed", failed: "failed", cancelled: "cancelled" };
    if (words[status]) setAnnounce(`${label} ${words[status]}`);
  };

  const balance = balanceUsd - spent > BigInt(0) ? balanceUsd - spent : BigInt(0);

  return (
    <section aria-labelledby={`${id}-title`} className={cn("flex h-[38rem] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-background", className)}>
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-[conic-gradient(from_140deg,#6366f1,#22d3ee,#a855f7,#6366f1)] text-white">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 id={`${id}-title`} className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {agentName}
            {simulated ? <SimulatedBadge /> : null}
          </h3>
          <p className="text-[12px] text-muted-foreground">Wallet agent</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <p className="text-right">
            <span className="block text-[11px] text-muted-foreground">Balance</span>
            <span className="font-mono text-[13px] font-semibold text-foreground">
              <RollingValue value={formatUsd(balance)} trend={balance} />
            </span>
          </p>
          <AddressPill address={address} size="sm" explorerUrl={explorerUrl} />
        </div>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-4" role="region" aria-label="Conversation">
        <div ref={list}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <p className="text-lg font-semibold tracking-tight text-foreground">What should we move today?</p>
              <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">I prepare every transaction as a card you can review. Nothing is signed until you approve it.</p>
              <motion.ul
                className="mt-5 grid w-full gap-2 sm:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger.base } } }}
              >
                {starterPrompts.slice(0, 3).map((s) => (
                  <motion.li key={s.title} variants={reduceMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } } }}>
                    <button
                      type="button"
                      onClick={() => send(s.prompt)}
                      className="group flex h-full w-full cursor-pointer flex-col items-start gap-1 rounded-xl border border-border p-3 text-left outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex w-full items-center justify-between text-[13px] font-medium text-foreground">
                        {s.title}
                        <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                      <span className="text-[12px] text-muted-foreground">{s.prompt}</span>
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          ) : (
            <ul className="space-y-5">
              {messages.map((m) =>
                m.role === "user" ? (
                  <motion.li
                    key={m.id}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: duration.base, ease: ease.out }}
                    className="flex justify-end"
                  >
                    <p className="max-w-[80%] rounded-2xl rounded-br-md bg-foreground px-3.5 py-2 text-[14px] text-background">
                      <span className="sr-only">You: </span>
                      {m.text}
                    </p>
                  </motion.li>
                ) : (
                  <li key={m.id}>
                    <span className="sr-only">{agentName}: </span>
                    <AgentMessage
                      reply={m.reply}
                      instant={!!instant[m.id]}
                      onSettled={settle(m)}
                      onStatus={onStatus}
                      onApprove={onApprove}
                      onReject={onReject}
                      explorerUrl={explorerUrl}
                    />
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-border p-3">
        <AnimatePresence initial={false}>
          {!busy && lastAgent?.reply.suggestions?.length ? (
            <motion.div
              key={lastAgent.id}
              role="group"
              aria-label="Suggestions"
              className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: duration.instant } }}
              transition={{ duration: duration.base, ease: ease.out }}
            >
              {lastAgent.reply.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="h-8 shrink-0 cursor-pointer rounded-full border border-border bg-background px-3 text-[12px] font-medium text-foreground outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <AIPromptInput
          placeholder="Swap, send or approve…"
          allowAttachments={false}
          maxRows={4}
          loading={busy}
          onStop={() => {
            if (lastAgent) setInstant((s) => ({ ...s, [lastAgent.id]: true }));
          }}
          onSubmit={(value) => send(value)}
          aria-label={`Message ${agentName}`}
        />
      </div>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </section>
  );
}
