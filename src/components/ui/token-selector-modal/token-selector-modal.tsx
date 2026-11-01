"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, overlayVariants } from "@/lib/motion";
import { formatAmount, formatUsd, toUsd } from "@/lib/web3/format";
import { TokenIcon } from "@/lib/web3/icons";
import type { Token } from "@/lib/web3/types";

export interface TokenSelectorModalProps {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Called when the dialog opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the dialog. */
  trigger?: ReactNode;
  /** Tokens to choose from. */
  tokens: Token[];
  /** Balances by token symbol, in each token's smallest unit. */
  balances?: Record<string, bigint>;
  /** Symbols offered as one-tap chips above the list. */
  popular?: string[];
  /** Symbol of the currently selected token (marked with a check). */
  selected?: string;
  /** Symbol that can't be picked, e.g. the other side of a swap. */
  disabledSymbol?: string;
  /** Called with the picked token; the dialog then closes. */
  onSelect: (token: Token) => void;
  /** Dialog title. @default "Select a token" */
  title?: string;
  /** Show skeleton rows while the token list loads. @default false */
  loading?: boolean;
}

const usdValue = (token: Token, balance?: bigint) =>
  balance !== undefined && token.price !== undefined ? toUsd(balance, token.decimals, token.price) : BigInt(0);

export function TokenSelectorModal({
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  tokens,
  balances = {},
  popular = [],
  selected,
  disabledSymbol,
  onSelect,
  title = "Select a token",
  loading = false,
}: TokenSelectorModalProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const listId = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const isOpen = open ?? internalOpen;

  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) {
      setQuery("");
      setActive(0);
    }
  };

  const q = query.trim().toLowerCase();
  const results = tokens
    .filter((t) => !q || t.symbol.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q) || t.address?.toLowerCase() === q)
    .sort((a, b) => {
      const diff = usdValue(b, balances[b.symbol]) - usdValue(a, balances[a.symbol]);
      return diff > BigInt(0) ? 1 : diff < BigInt(0) ? -1 : a.symbol.localeCompare(b.symbol);
    });
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));
  const popularTokens = popular.map((s) => tokens.find((t) => t.symbol === s)).filter((t): t is Token => Boolean(t));

  function choose(token: Token) {
    if (token.symbol === disabledSymbol) return;
    onSelect(token);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = (activeIndex + step + results.length) % Math.max(1, results.length);
      setActive(next);
      document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      choose(results[activeIndex]);
    }
  }

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
                  variants={overlayVariants(reduceMotion)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="pointer-events-auto flex max-h-[min(36rem,calc(100dvh-2rem))] w-full max-w-sm flex-col overflow-hidden rounded-[20px] border border-border bg-popover text-popover-foreground shadow-xl outline-none"
                >
                  <div className="flex h-14 shrink-0 items-center justify-between pr-2 pl-5">
                    <Dialog.Title className="text-base font-semibold tracking-tight text-foreground">{title}</Dialog.Title>
                    <Dialog.Close
                      aria-label="Close"
                      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Dialog.Close>
                  </div>
                  <div className="shrink-0 px-4">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                      <input
                        autoFocus
                        role="combobox"
                        aria-expanded="true"
                        aria-controls={listId}
                        aria-activedescendant={results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
                        aria-label="Search tokens by name, symbol or address"
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setActive(0);
                        }}
                        onKeyDown={onKeyDown}
                        placeholder="Search name or paste address"
                        className="h-11 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/15"
                      />
                    </div>
                    {popularTokens.length ? (
                      <div className="flex flex-wrap gap-1.5 pt-3 pb-1">
                        {popularTokens.map((token) => (
                          <button
                            key={token.symbol}
                            type="button"
                            onClick={() => choose(token)}
                            disabled={token.symbol === disabledSymbol}
                            aria-pressed={token.symbol === selected}
                            className={cn(
                              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-1 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
                              token.symbol === selected ? "border-foreground/30 bg-accent text-foreground" : "border-border bg-background text-foreground hover:bg-accent",
                            )}
                          >
                            <TokenIcon token={token} size={22} />
                            {token.symbol}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border px-2 py-2">
                    {loading ? (
                      <ul aria-busy="true" aria-label="Loading tokens">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <li key={i} className="flex h-14 items-center gap-3 px-3">
                            <span className="size-8 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
                            <span className="flex-1 space-y-1.5">
                              <span className="block h-3 w-14 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                              <span className="block h-2.5 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : results.length === 0 ? (
                      <p className="px-3 py-10 text-center text-sm text-muted-foreground">No tokens match &ldquo;{query.trim()}&rdquo;.</p>
                    ) : (
                      <ul id={listId} role="listbox" aria-label="Tokens">
                        {results.map((token, index) => {
                          const balance = balances[token.symbol];
                          const isDisabled = token.symbol === disabledSymbol;
                          return (
                            <motion.li
                              key={token.symbol}
                              id={`${listId}-${index}`}
                              role="option"
                              aria-selected={index === activeIndex}
                              aria-disabled={isDisabled || undefined}
                              onPointerMove={() => setActive(index)}
                              onClick={() => choose(token)}
                              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                              animate={{ opacity: isDisabled ? 0.45 : 1, y: 0 }}
                              transition={{ duration: duration.base, ease: ease.out, delay: Math.min(index, 10) * 0.025 }}
                              className={cn(
                                "flex h-14 cursor-pointer items-center gap-3 rounded-xl px-3",
                                index === activeIndex && "bg-accent",
                                isDisabled && "cursor-not-allowed",
                              )}
                            >
                              <TokenIcon token={token} size={32} />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                  {token.symbol}
                                  {token.symbol === selected ? <Check className="size-3.5" aria-label="Selected" /> : null}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">{token.name}</span>
                              </span>
                              {balance !== undefined && balance > BigInt(0) ? (
                                <span className="text-right">
                                  <span className="block font-mono text-sm text-foreground tabular-nums">{formatAmount(balance, token.decimals)}</span>
                                  {token.price !== undefined ? (
                                    <span className="block font-mono text-xs text-muted-foreground tabular-nums">
                                      {formatUsd(toUsd(balance, token.decimals, token.price))}
                                    </span>
                                  ) : null}
                                </span>
                              ) : null}
                            </motion.li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
