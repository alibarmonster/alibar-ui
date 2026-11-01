"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { truncateAddress } from "@/lib/web3/format";
import { explorerLink } from "@/lib/web3/types";

export type TransactionToastStatus = "pending" | "confirmed" | "failed";

export interface TransactionToastItem {
  id: string;
  /** e.g. "Swapping 0.5 ETH for USDC". */
  title: string;
  /** Second line, e.g. "Confirmed in 12s" or an error reason. */
  description?: string;
  status: TransactionToastStatus;
  /** Transaction hash, linked to the explorer. */
  hash?: string;
  /** Pending progress from 0 to 1. Omit for an indeterminate spinner. */
  progress?: number;
}

export interface TransactionToastStackProps
  extends Omit<ComponentProps<"section">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Toasts, oldest first. The newest sits in front. */
  toasts: TransactionToastItem[];
  /** Called when a toast is dismissed (button or auto-dismiss). */
  onDismiss?: (id: string) => void;
  /** Block explorer base URL for hash links. */
  explorerUrl?: string;
  /** Auto-dismiss settled (confirmed or failed) toasts after this many ms. 0 keeps them. @default 0 */
  dismissAfter?: number;
  /** Toasts shown in the collapsed stack. @default 3 */
  visibleToasts?: number;
}

const TOAST_HEIGHT = 68;
const GAP = 8;

function StatusIcon({ status, progress, reduceMotion }: { status: TransactionToastStatus; progress?: number; reduceMotion: boolean }) {
  return (
    <span className="relative grid size-8 shrink-0 place-items-center *:[grid-area:1/1]" aria-hidden="true">
      <AnimatePresence initial={false}>
        {status === "pending" ? (
          <motion.svg key="pending" viewBox="0 0 32 32" className="size-8" exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.18 }}>
            <circle cx="16" cy="16" r="13" fill="none" stroke="var(--border)" strokeWidth="3" />
            {progress === undefined ? (
              <g className="origin-center animate-spin [transform-box:fill-box] motion-reduce:animate-pulse">
                <circle cx="16" cy="16" r="13" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray="0.3 1" />
              </g>
            ) : (
              <circle
                cx="16"
                cy="16"
                r="13"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - Math.min(1, Math.max(0, progress))}
                transform="rotate(-90 16 16)"
                className="transition-[stroke-dashoffset] duration-500 ease-out"
              />
            )}
          </motion.svg>
        ) : status === "confirmed" ? (
          <motion.svg
            key="confirmed"
            viewBox="0 0 32 32"
            className="size-8"
            initial={reduceMotion ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduceMotion ? { duration: 0.15 } : spring.bouncy}
          >
            <circle cx="16" cy="16" r="14" fill="var(--success)" />
            <motion.path
              d="M10 16.5l4 4 8-9"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: reduceMotion ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35, delay: 0.12, ease: "easeOut" }}
            />
          </motion.svg>
        ) : (
          <motion.svg
            key="failed"
            viewBox="0 0 32 32"
            className="size-8"
            initial={reduceMotion ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduceMotion ? { duration: 0.15 } : spring.bouncy}
          >
            <circle cx="16" cy="16" r="14" fill="var(--destructive)" />
            <path d="M11.5 11.5l9 9M20.5 11.5l-9 9" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          </motion.svg>
        )}
      </AnimatePresence>
    </span>
  );
}

function Toast({
  toast,
  explorerUrl,
  onDismiss,
  dismissAfter,
  reduceMotion,
}: {
  toast: TransactionToastItem;
  explorerUrl?: string;
  onDismiss?: (id: string) => void;
  dismissAfter: number;
  reduceMotion: boolean;
}) {
  const href = toast.hash ? explorerLink(explorerUrl, "tx", toast.hash) : undefined;
  const settled = toast.status !== "pending";

  useEffect(() => {
    if (!settled || !dismissAfter || !onDismiss) return;
    const timer = window.setTimeout(() => onDismiss(toast.id), dismissAfter);
    return () => window.clearTimeout(timer);
  }, [settled, dismissAfter, onDismiss, toast.id]);

  return (
    <motion.div
      animate={toast.status === "failed" && !reduceMotion ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.42, ease: "easeInOut" }}
      className="flex h-[68px] items-center gap-3 rounded-2xl border border-border bg-popover py-3 pr-2 pl-3 text-popover-foreground shadow-lg"
    >
      <StatusIcon status={toast.status} progress={toast.progress} reduceMotion={reduceMotion} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{toast.title}</p>
        <p
          className={cn(
            "flex items-center gap-1.5 truncate text-xs",
            toast.status === "failed" ? "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]" : "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {toast.description ?? (toast.status === "pending" ? "Waiting for confirmation…" : toast.status === "confirmed" ? "Confirmed" : "Transaction failed")}
          </span>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-0.5 rounded font-mono text-muted-foreground underline decoration-border underline-offset-2 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {truncateAddress(toast.hash ?? "", { start: 6, end: 4 })}
              <ArrowUpRight className="size-3" aria-hidden="true" />
              <span className="sr-only"> (view transaction)</span>
            </a>
          ) : null}
        </p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss"
          className="relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors after:absolute after:-inset-1 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
      <span className="sr-only" role={toast.status === "failed" ? "alert" : "status"}>
        {toast.title}: {toast.status === "pending" ? "pending" : toast.status}
      </span>
    </motion.div>
  );
}

export function TransactionToastStack({
  toasts,
  onDismiss,
  explorerUrl,
  dismissAfter = 0,
  visibleToasts = 3,
  className,
  ...props
}: TransactionToastStackProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);
  const ordered = [...toasts].reverse();
  const count = ordered.length;
  const height = expanded ? count * TOAST_HEIGHT + Math.max(0, count - 1) * GAP : count ? TOAST_HEIGHT + Math.min(count - 1, visibleToasts - 1) * 10 : 0;

  return (
    <section
      aria-label="Transaction notifications"
      onPointerEnter={() => setExpanded(true)}
      onPointerLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setExpanded(false);
      }}
      className={cn("relative w-full max-w-sm transition-[height] duration-300 ease-out motion-reduce:transition-none", className)}
      style={{ height }}
      {...props}
    >
      <ol className="contents">
        <AnimatePresence initial={false}>
          {ordered.map((toast, index) => {
            const hidden = !expanded && index >= visibleToasts;
            return (
              <motion.li
                key={toast.id}
                className="absolute inset-x-0 bottom-0"
                style={{ zIndex: count - index, transformOrigin: "bottom center" }}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
                animate={{
                  opacity: hidden ? 0 : 1,
                  y: expanded ? -index * (TOAST_HEIGHT + GAP) : -index * 10,
                  scale: expanded ? 1 : 1 - index * 0.05,
                }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40, transition: { duration: 0.2 } }}
                transition={reduceMotion ? { duration: 0.15 } : spring.smooth}
                aria-hidden={hidden || undefined}
                inert={hidden}
              >
                <Toast toast={toast} explorerUrl={explorerUrl} onDismiss={onDismiss} dismissAfter={dismissAfter} reduceMotion={reduceMotion} />
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </section>
  );
}
