"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, ArrowDown, ArrowUpRight, X } from "lucide-react";
import { HoldToConfirmButton } from "@/components/ui/hold-to-confirm-button/hold-to-confirm-button";
import { cn } from "@/lib/utils";
import { duration, ease, overlayVariants, spring } from "@/lib/motion";
import { formatAmount, formatUsd, USD_DECIMALS } from "@/lib/web3/format";
import { TokenIcon } from "@/lib/web3/icons";
import { explorerLink, type Token, type TxStatus } from "@/lib/web3/types";

export interface ReviewAsset {
  /** e.g. "You pay", "You receive". */
  label: string;
  token: Token;
  /** Amount in the token's smallest unit. */
  amount: bigint;
  /** USD value as a bigint with 8 decimals. */
  usd?: bigint;
}

export interface ReviewDetail {
  label: string;
  value: ReactNode;
  /** Bold the row, e.g. for the total. */
  emphasis?: boolean;
}

export interface TransactionReviewModalProps {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Called when the dialog opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the dialog. */
  trigger?: ReactNode;
  /** Dialog title on the review step. @default "Review transaction" */
  title?: string;
  /** Assets moving, shown top to bottom with an arrow between them. */
  assets?: ReviewAsset[];
  /** Rows such as network fee and total. */
  details?: ReviewDetail[];
  /** A warning shown above the confirm button, e.g. high price impact. */
  warning?: ReactNode;
  /** Transaction lifecycle. "idle" is the review step. @default "idle" */
  status?: TxStatus;
  /** Called when the hold-to-confirm completes. Request the signature here. */
  onConfirm: () => void;
  /** Label of the hold button. @default "Hold to confirm" */
  confirmLabel?: string;
  /** Milliseconds to hold the button. @default 1200 */
  holdDuration?: number;
  /** Hash of the submitted transaction, linked from the pending and done states. */
  txHash?: string;
  /** Block explorer base URL. */
  explorerUrl?: string;
  /** Reason shown in the failed state. @default "The transaction was rejected or reverted." */
  error?: string;
  /** Called from "Try again" in the failed state. */
  onRetry?: () => void;
  /** Heading of the confirmed state. @default "Transaction confirmed" */
  successTitle?: string;
}

function Ring({ tone }: { tone: "muted" | "primary" }) {
  return (
    <svg viewBox="0 0 64 64" className="size-16" aria-hidden="true">
      <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="5" />
      <g className="origin-center animate-spin [transform-box:fill-box] motion-reduce:animate-pulse">
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke={tone === "primary" ? "var(--primary)" : "var(--muted-foreground)"}
          strokeWidth="5"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="0.25 1"
        />
      </g>
    </svg>
  );
}

function Outcome({ ok, reduceMotion }: { ok: boolean; reduceMotion: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      className="size-16"
      aria-hidden="true"
      initial={reduceMotion ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={reduceMotion ? { duration: 0.15 } : spring.bouncy}
    >
      <circle cx="32" cy="32" r="30" fill={ok ? "var(--success)" : "var(--destructive)"} />
      {ok ? (
        <motion.path
          d="M20 33l8 8 16-18"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduceMotion ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        />
      ) : (
        <path d="M23 23l18 18M41 23L23 41" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      )}
    </motion.svg>
  );
}

const ghostButton =
  "inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground shadow-xs outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring";
const solidButton =
  "inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background outline-none transition-colors hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function TransactionReviewModal({
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  title = "Review transaction",
  assets = [],
  details = [],
  warning,
  status = "idle",
  onConfirm,
  confirmLabel = "Hold to confirm",
  holdDuration = 1200,
  txHash,
  explorerUrl,
  error = "The transaction was rejected or reverted.",
  onRetry,
  successTitle = "Transaction confirmed",
}: TransactionReviewModalProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const href = txHash ? explorerLink(explorerUrl, "tx", txHash) : undefined;

  const heading = {
    idle: title,
    "awaiting-signature": "Confirm in your wallet",
    pending: "Transaction submitted",
    confirmed: successTitle,
    failed: "Transaction failed",
  }[status];

  const swap = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 10, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -6, filter: "blur(4px)" },
      };

  const explorer = href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded text-[13px] font-medium text-foreground underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      View on explorer
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
    </a>
  ) : null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <AnimatePresence>
        {isOpen ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-[3px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.base }}
              />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  layout
                  variants={overlayVariants(reduceMotion)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ layout: reduceMotion ? { duration: 0 } : spring.smooth }}
                  style={{ borderRadius: 20 }}
                  className="pointer-events-auto relative w-full max-w-sm overflow-hidden border border-border bg-popover text-popover-foreground shadow-xl outline-none"
                >
                  <Dialog.Close
                    aria-label="Close"
                    className="absolute top-3 right-3 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Dialog.Close>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={status}
                      variants={swap}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: duration.base, ease: ease.out }}
                      className="p-5"
                    >
                      {status === "idle" ? (
                        <>
                          <Dialog.Title className="pr-10 text-base font-semibold tracking-tight text-foreground">{heading}</Dialog.Title>
                          {assets.length ? (
                            <div className="mt-4 space-y-1">
                              {assets.map((asset, index) => (
                                <div key={asset.label}>
                                  {index > 0 ? (
                                    <div className="relative z-10 -my-3 flex justify-center">
                                      <span className="grid size-7 place-items-center rounded-lg border border-border bg-background text-muted-foreground">
                                        <ArrowDown className="size-3.5" aria-hidden="true" />
                                      </span>
                                    </div>
                                  ) : null}
                                  <div className="rounded-xl bg-surface p-3.5">
                                    <p className="text-xs text-muted-foreground">{asset.label}</p>
                                    <div className="mt-1 flex items-center gap-2.5">
                                      <TokenIcon token={asset.token} size={28} />
                                      <p className="min-w-0 flex-1 truncate font-mono text-xl font-semibold tracking-tight text-foreground tabular-nums">
                                        {formatAmount(asset.amount, asset.token.decimals, { maxFractionDigits: 6 })}{" "}
                                        <span className="font-sans text-base font-medium text-muted-foreground">{asset.token.symbol}</span>
                                      </p>
                                    </div>
                                    {asset.usd !== undefined ? (
                                      <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">{formatUsd(asset.usd, USD_DECIMALS)}</p>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {details.length ? (
                            <dl className="mt-4 space-y-2 text-[13px]">
                              {details.map((detail) => (
                                <div key={detail.label} className={cn("flex items-center justify-between gap-4", detail.emphasis && "border-t border-border pt-2")}>
                                  <dt className="text-muted-foreground">{detail.label}</dt>
                                  <dd className={cn("text-right font-mono text-foreground tabular-nums", detail.emphasis && "font-semibold")}>{detail.value}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : null}
                          {warning ? (
                            <div role="alert" className="mt-4 flex gap-2.5 rounded-xl border border-warning/35 bg-warning/8 p-3 text-[13px] leading-5 text-foreground">
                              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklab,var(--warning)_55%,var(--foreground))]" aria-hidden="true" />
                              <div>{warning}</div>
                            </div>
                          ) : null}
                          <HoldToConfirmButton
                            className="mt-5 w-full"
                            size="lg"
                            variant="primary"
                            duration={holdDuration}
                            onConfirm={onConfirm}
                            confirmedLabel="Opening wallet…"
                          >
                            {confirmLabel}
                          </HoldToConfirmButton>
                          <p className="mt-2 text-center text-xs text-muted-foreground">This can&apos;t be undone once it&apos;s on-chain.</p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center pt-4 text-center">
                          {status === "awaiting-signature" ? (
                            <Ring tone="muted" />
                          ) : status === "pending" ? (
                            <Ring tone="primary" />
                          ) : (
                            <Outcome ok={status === "confirmed"} reduceMotion={reduceMotion} />
                          )}
                          <Dialog.Title className="mt-4 text-base font-semibold tracking-tight text-foreground">{heading}</Dialog.Title>
                          <p className="mt-1 max-w-64 text-[13px] leading-5 text-muted-foreground">
                            {status === "awaiting-signature"
                              ? "Approve the request in your wallet to continue."
                              : status === "pending"
                                ? "Waiting for the network to confirm it. You can close this window."
                                : status === "confirmed"
                                  ? "It's final and on-chain."
                                  : error}
                          </p>
                          {status !== "awaiting-signature" && explorer ? <div className="mt-3">{explorer}</div> : null}
                          {status === "confirmed" ? (
                            <div className="mt-5 flex w-full">
                              <Dialog.Close className={solidButton}>Done</Dialog.Close>
                            </div>
                          ) : status === "failed" ? (
                            <div className="mt-5 flex w-full gap-2">
                              <Dialog.Close className={ghostButton}>Close</Dialog.Close>
                              {onRetry ? (
                                <button type="button" onClick={onRetry} className={solidButton}>
                                  Try again
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <span className="sr-only" role="status" aria-live="polite">
                    {status === "idle" ? "" : `${heading}.`}
                  </span>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
