"use client";

import { useId, useState, type ComponentProps } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Gift,
  Layers,
  Route,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { AddressPill } from "@/components/ui/address-pill/address-pill";
import { CopyButton } from "@/components/ui/copy-button/copy-button";
import { cn } from "@/lib/utils";
import { formatAmount, truncateAddress } from "@/lib/web3/format";
import { explorerLink } from "@/lib/web3/types";

export type TransactionType = "swap" | "send" | "receive" | "approve" | "bridge" | "stake" | "claim";
export type TransactionStatus = "pending" | "confirmed" | "failed";

export interface TransactionRecord {
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  /** ISO 8601 timestamp. */
  timestamp: string;
  from: string;
  to: string;
  /** One-line description, e.g. "Swap 0.5 ETH for USDC". */
  summary: string;
  /** Main value moved; "in" shows as +, "out" as −. */
  amount?: { symbol: string; value: bigint; decimals: number; direction: "in" | "out" };
  /** Network fee in the native token's smallest unit. */
  fee: bigint;
}

export interface TransactionHistoryProps extends Omit<ComponentProps<"div">, "children"> {
  /** Transactions, newest first. */
  transactions: TransactionRecord[];
  /** Block explorer base URL for hash and address links. */
  explorerUrl?: string;
  /** Native token symbol for fees. @default "ETH" */
  nativeSymbol?: string;
  /** Native token decimals for fees. @default 18 */
  nativeDecimals?: number;
  /** Locale for dates and times. @default "en-US" */
  locale?: string;
  /** Time zone for grouping and times. Fixed by default so server and client agree. @default "UTC" */
  timeZone?: string;
  /** Show skeleton rows. @default false */
  loading?: boolean;
  /** Message when there are no transactions. @default "No transactions yet." */
  emptyMessage?: string;
}

const TYPE_ICON: Record<TransactionType, LucideIcon> = {
  swap: ArrowLeftRight,
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  approve: ShieldCheck,
  bridge: Route,
  stake: Layers,
  claim: Gift,
};

function StatusBadge({ status }: { status: TransactionStatus }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <svg className="size-3 animate-spin motion-reduce:animate-pulse" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        Pending
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]">
        <X className="size-3" aria-hidden="true" strokeWidth={3} />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Check className="size-3 text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]" aria-hidden="true" strokeWidth={3} />
      <span className="sr-only">Confirmed</span>
    </span>
  );
}

function Row({
  tx,
  explorerUrl,
  nativeSymbol,
  nativeDecimals,
  time,
}: {
  tx: TransactionRecord;
  explorerUrl?: string;
  nativeSymbol: string;
  nativeDecimals: number;
  time: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const Icon = TYPE_ICON[tx.type];
  const href = explorerLink(explorerUrl, "tx", tx.hash);

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            tx.status === "failed" ? "bg-destructive/8 text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]" : "bg-muted text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-sm font-medium", tx.status === "failed" ? "text-muted-foreground line-through decoration-border" : "text-foreground")}>
            {tx.summary}
          </span>
          <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground tabular-nums">
            {time}
            <StatusBadge status={tx.status} />
          </span>
        </span>
        {tx.amount ? (
          <span
            className={cn(
              "font-mono text-sm tabular-nums",
              tx.amount.direction === "in" ? "text-[color-mix(in_oklab,var(--success)_75%,var(--foreground))]" : "text-foreground",
            )}
          >
            {tx.amount.direction === "in" ? "+" : "−"}
            {formatAmount(tx.amount.value, tx.amount.decimals)} {tx.amount.symbol}
          </span>
        ) : null}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-aria-expanded:rotate-180" aria-hidden="true" />
      </button>
      <div
        id={id}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        inert={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <dl className="mx-4 mb-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2.5 rounded-xl bg-surface p-3 text-[13px]">
            <dt className="text-muted-foreground">From</dt>
            <dd className="justify-self-end">
              <AddressPill address={tx.from} size="sm" explorerUrl={explorerUrl} />
            </dd>
            <dt className="text-muted-foreground">To</dt>
            <dd className="justify-self-end">
              <AddressPill address={tx.to} size="sm" explorerUrl={explorerUrl} />
            </dd>
            <dt className="text-muted-foreground">Network fee</dt>
            <dd className="justify-self-end font-mono text-foreground tabular-nums">
              {formatAmount(tx.fee, nativeDecimals, { maxFractionDigits: 6 })} {nativeSymbol}
            </dd>
            <dt className="text-muted-foreground">Hash</dt>
            <dd className="flex items-center justify-self-end">
              <span className="pr-1 font-mono text-foreground tabular-nums" title={tx.hash}>
                {truncateAddress(tx.hash, { start: 8, end: 6 })}
              </span>
              <CopyButton value={tx.hash} variant="ghost" size="sm" aria-label="Copy transaction hash" className="size-7 rounded-full text-muted-foreground" />
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View transaction on block explorer"
                  className="relative inline-flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors after:absolute after:-inset-1 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              ) : null}
            </dd>
          </dl>
        </div>
      </div>
    </li>
  );
}

export function TransactionHistory({
  transactions,
  explorerUrl,
  nativeSymbol = "ETH",
  nativeDecimals = 18,
  locale = "en-US",
  timeZone = "UTC",
  loading = false,
  emptyMessage = "No transactions yet.",
  className,
  ...props
}: TransactionHistoryProps) {
  const dayFormat = new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone });
  const keyFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone });
  const timeFormat = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone });

  const groups: { key: string; label: string; items: TransactionRecord[] }[] = [];
  for (const tx of transactions) {
    const date = new Date(tx.timestamp);
    const key = keyFormat.format(date);
    const group = groups.at(-1);
    if (group?.key === key) group.items.push(tx);
    else groups.push({ key, label: dayFormat.format(date), items: [tx] });
  }

  return (
    <div className={cn("w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-sm", className)} {...props}>
      {loading ? (
        <ul aria-busy="true" aria-label="Loading transactions" className="divide-y divide-border">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3.5">
              <span className="size-9 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
              <span className="flex-1 space-y-1.5">
                <span className="block h-3 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                <span className="block h-2.5 w-20 animate-pulse rounded bg-muted motion-reduce:animate-none" />
              </span>
            </li>
          ))}
        </ul>
      ) : groups.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        groups.map((group) => (
          <div key={group.key} role="group" aria-label={group.label}>
            <p aria-hidden="true" className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur">
              {group.label}
            </p>
            <ul className="divide-y divide-border">
              {group.items.map((tx) => (
                <Row
                  key={tx.hash}
                  tx={tx}
                  explorerUrl={explorerUrl}
                  nativeSymbol={nativeSymbol}
                  nativeDecimals={nativeDecimals}
                  time={timeFormat.format(new Date(tx.timestamp))}
                />
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
