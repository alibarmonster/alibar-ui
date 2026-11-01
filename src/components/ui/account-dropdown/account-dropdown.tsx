"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { DropdownMenu } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, ChevronDown, Copy, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, overlayVariants } from "@/lib/motion";
import { checksumAddress, formatUsd, truncateAddress, USD_DECIMALS } from "@/lib/web3/format";
import { AddressAvatar, ChainIcon } from "@/lib/web3/icons";
import { RollingValue } from "@/lib/web3/rolling-value";
import { explorerLink, type Chain } from "@/lib/web3/types";

export interface AccountDropdownProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Connected account address. */
  address: string;
  /** Display name (e.g. an ENS name). */
  name?: string;
  /** Total balance in USD as a bigint with `balanceDecimals` decimals. */
  balance?: bigint;
  /** Decimals of `balance`. @default 8 */
  balanceDecimals?: number;
  /** Show skeletons while the balance loads. @default false */
  loading?: boolean;
  /** Current network, shown in the menu header. */
  chain?: Chain;
  /** Block explorer base URL. Falls back to the chain's explorer. */
  explorerUrl?: string;
  /** Show the balance in the trigger next to the address. @default true */
  showBalance?: boolean;
  /** Called from the "Disconnect" item. */
  onDisconnect?: () => void;
}

const itemClass =
  "flex h-10 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-sm text-foreground outline-none transition-colors data-[highlighted]:bg-accent";

export function AccountDropdown({
  address,
  name,
  balance,
  balanceDecimals = USD_DECIMALS,
  loading = false,
  chain,
  explorerUrl,
  showBalance = true,
  onDisconnect,
  className,
  ...props
}: AccountDropdownProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [copied, setCopied] = useState(false);
  const checksummed = checksumAddress(address);
  const short = truncateAddress(checksummed);
  const href = explorerLink(explorerUrl ?? chain?.explorerUrl, "address", checksummed);
  const total = balance === undefined ? undefined : formatUsd(balance, balanceDecimals);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const skeleton = (width: string) => (
    <span className={cn("inline-block h-[0.9em] animate-pulse rounded bg-muted align-middle motion-reduce:animate-none", width)} />
  );

  return (
    <div className={cn("inline-flex", className)} {...props}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className="group inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-background pr-3 pl-1 text-sm font-medium text-foreground shadow-xs outline-none transition-colors select-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <AddressAvatar address={checksummed} size={30} />
          <span className="sr-only">Account </span>
          {showBalance ? (
            <span className="hidden border-r border-border pr-2 font-mono text-[13px] tabular-nums sm:inline-flex">
              {loading || total === undefined ? skeleton("w-14") : <RollingValue value={total} trend={balance} />}
            </span>
          ) : null}
          <span className={cn(name ? "" : "font-mono tabular-nums")}>{name ?? short}</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={8} collisionPadding={12} asChild>
            <motion.div
              variants={overlayVariants(reduceMotion)}
              initial="hidden"
              animate="visible"
              className="z-50 w-72 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg outline-none"
            >
              <div className="rounded-xl bg-surface p-3.5">
                <div className="flex items-center gap-3">
                  <AddressAvatar address={checksummed} size={40} />
                  <div className="min-w-0 flex-1">
                    {name ? <p className="truncate text-sm font-semibold text-foreground">{name}</p> : null}
                    <p className="font-mono text-xs text-muted-foreground tabular-nums">{short}</p>
                  </div>
                  {chain ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background py-0.5 pr-2 pl-0.5 text-xs text-muted-foreground">
                      <ChainIcon chain={chain} size={16} />
                      {chain.shortName ?? chain.name}
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Total balance</p>
                <p className="mt-0.5 font-mono text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {loading || total === undefined ? (
                    <>
                      {skeleton("w-32")}
                      <span className="sr-only">Loading balance</span>
                    </>
                  ) : (
                    <RollingValue value={total} trend={balance} />
                  )}
                </p>
              </div>
              <div className="pt-1.5">
                <DropdownMenu.Item
                  className={itemClass}
                  onSelect={(event) => {
                    event.preventDefault();
                    navigator.clipboard.writeText(checksummed).then(() => setCopied(true), () => {});
                  }}
                >
                  <span className="grid size-4 place-items-center text-muted-foreground *:[grid-area:1/1]" aria-hidden="true">
                    <AnimatePresence initial={false}>
                      <motion.span
                        key={copied ? "check" : "copy"}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, filter: "blur(3px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, filter: "blur(3px)" }}
                        transition={{ duration: duration.quick }}
                        className={cn(copied && "text-success")}
                      >
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span aria-live="polite">{copied ? "Address copied" : "Copy address"}</span>
                </DropdownMenu.Item>
                {href ? (
                  <DropdownMenu.Item asChild className={itemClass}>
                    <a href={href} target="_blank" rel="noreferrer">
                      <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
                      View on explorer
                    </a>
                  </DropdownMenu.Item>
                ) : null}
                <DropdownMenu.Separator className="mx-1 my-1 h-px bg-border" />
                <DropdownMenu.Item
                  className={cn(itemClass, "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))] data-[highlighted]:bg-destructive/8")}
                  onSelect={() => onDisconnect?.()}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Disconnect
                </DropdownMenu.Item>
              </div>
            </motion.div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
