"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { DropdownMenu } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertCircle, ArrowUpRight, Check, ChevronDown, Copy, LogOut, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, overlayVariants, spring } from "@/lib/motion";
import { checksumAddress, truncateAddress } from "@/lib/web3/format";
import { AddressAvatar, WalletIcon } from "@/lib/web3/icons";
import { explorerLink, type WalletOption } from "@/lib/web3/types";

export type ConnectStatus = "disconnected" | "connecting" | "connected" | "error";

export interface ConnectWalletButtonProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Connection state, owned by your wallet layer. */
  status: ConnectStatus;
  /** Wallets offered in the list. */
  wallets: WalletOption[];
  /** Called with a wallet id when the user picks one. */
  onConnect: (walletId: string) => void;
  /** Connected account address. */
  address?: string;
  /** Display name for the connected account (e.g. an ENS name). */
  name?: string;
  /** Wallet being connected, named in the connecting state. */
  connectingWalletId?: string;
  /** Block explorer base URL for the "View on explorer" action. */
  explorerUrl?: string;
  /** Called from the account menu's "Disconnect" action. */
  onDisconnect?: () => void;
  /** Label of the idle button. @default "Connect wallet" */
  label?: string;
  /** Label shown after a failed or rejected connection. @default "Connection failed" */
  errorLabel?: string;
}

const swap = (reduceMotion: boolean) =>
  reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 6, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -6, filter: "blur(4px)" },
      };

const itemClass =
  "flex h-10 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-sm text-foreground outline-none transition-colors data-[highlighted]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export function ConnectWalletButton({
  status,
  wallets,
  onConnect,
  address,
  name,
  connectingWalletId,
  explorerUrl,
  onDisconnect,
  label = "Connect wallet",
  errorLabel = "Connection failed",
  className,
  ...props
}: ConnectWalletButtonProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const connected = status === "connected" && address !== undefined;
  const checksummed = address ? checksumAddress(address) : "";
  const connectingWallet = wallets.find((w) => w.id === connectingWalletId);
  const href = connected ? explorerLink(explorerUrl, "address", checksummed) : undefined;
  const variants = swap(reduceMotion);
  const contentKey = connected ? "connected" : status;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(checksummed);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the menu simply stays as is.
    }
  }

  const announcement = {
    disconnected: "",
    connecting: `Connecting${connectingWallet ? ` to ${connectingWallet.name}` : ""}`,
    connected: connected ? `Connected as ${name ?? truncateAddress(checksummed)}` : "",
    error: errorLabel,
  }[status];

  return (
    <div className={cn("inline-flex", className)} {...props}>
      <DropdownMenu.Root open={open} onOpenChange={(next) => setOpen(status === "connecting" ? false : next)}>
        <DropdownMenu.Trigger asChild>
          <motion.button
            type="button"
            layout
            aria-busy={status === "connecting" || undefined}
            aria-label={connected ? `Account ${name ?? truncateAddress(checksummed)}` : undefined}
            transition={reduceMotion ? { duration: 0 } : { layout: spring.smooth, x: { duration: 0.42, ease: "easeInOut" } }}
            animate={status === "error" && !reduceMotion ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
            style={{ borderRadius: 999 }}
            className={cn(
              "relative inline-flex h-10 shrink-0 cursor-pointer items-center overflow-hidden text-sm font-medium whitespace-nowrap outline-none select-none",
              "transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              connected
                ? "border border-border bg-background pr-3 pl-1 text-foreground shadow-xs hover:bg-surface"
                : status === "error"
                  ? "border border-destructive/30 bg-destructive/8 px-4 text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))] hover:bg-destructive/12"
                  : "bg-foreground px-4 text-background hover:bg-foreground/90",
              status === "connecting" && "cursor-progress",
            )}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={contentKey}
                className="flex items-center gap-2"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: duration.quick, ease: ease.out }}
              >
                {connected ? (
                  <>
                    <AddressAvatar address={checksummed} size={30} />
                    <span className={cn("pl-0.5", name ? "" : "font-mono tabular-nums")}>{name ?? truncateAddress(checksummed)}</span>
                    <ChevronDown
                      className={cn("size-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
                      aria-hidden="true"
                    />
                  </>
                ) : status === "connecting" ? (
                  <>
                    <svg className="size-4 animate-spin motion-reduce:animate-pulse" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    {connectingWallet ? `Opening ${connectingWallet.name}…` : "Connecting…"}
                  </>
                ) : status === "error" ? (
                  <>
                    <AlertCircle className="size-4" aria-hidden="true" />
                    {errorLabel}
                    <span className="opacity-60">· Retry</span>
                  </>
                ) : (
                  <>
                    <Wallet className="size-4" aria-hidden="true" />
                    {label}
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </DropdownMenu.Trigger>

        <AnimatePresence>
          {open ? (
            <DropdownMenu.Portal forceMount>
              <DropdownMenu.Content asChild forceMount align="end" sideOffset={8} collisionPadding={12}>
                <motion.div
                  variants={overlayVariants(reduceMotion)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="z-50 w-64 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg outline-none"
                >
                  {connected ? (
                    <>
                      <div className="flex items-center gap-3 px-2.5 pt-2 pb-3">
                        <AddressAvatar address={checksummed} size={36} />
                        <div className="min-w-0">
                          {name ? <p className="truncate text-sm font-medium text-foreground">{name}</p> : null}
                          <p className="font-mono text-xs text-muted-foreground tabular-nums">{truncateAddress(checksummed)}</p>
                        </div>
                      </div>
                      <DropdownMenu.Separator className="mx-1 mb-1 h-px bg-border" />
                      <DropdownMenu.Item
                        className={itemClass}
                        onSelect={(event) => {
                          event.preventDefault();
                          void copyAddress();
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
                        {copied ? "Copied" : "Copy address"}
                      </DropdownMenu.Item>
                      {href ? (
                        <DropdownMenu.Item asChild className={itemClass}>
                          <a href={href} target="_blank" rel="noreferrer">
                            <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
                            View on explorer
                          </a>
                        </DropdownMenu.Item>
                      ) : null}
                      <DropdownMenu.Item
                        className={cn(itemClass, "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))] data-[highlighted]:bg-destructive/8")}
                        onSelect={() => onDisconnect?.()}
                      >
                        <LogOut className="size-4" aria-hidden="true" />
                        Disconnect
                      </DropdownMenu.Item>
                    </>
                  ) : (
                    <>
                      <DropdownMenu.Label className="px-2.5 pt-1.5 pb-2 text-xs font-medium text-muted-foreground">
                        Choose a wallet
                      </DropdownMenu.Label>
                      {wallets.map((wallet) => (
                        <DropdownMenu.Item
                          key={wallet.id}
                          className={cn(itemClass, "h-12")}
                          onSelect={() => onConnect(wallet.id)}
                        >
                          <WalletIcon wallet={wallet} size={30} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{wallet.name}</span>
                            {wallet.description || wallet.installed ? (
                              <span className="block truncate text-xs text-muted-foreground">
                                {wallet.description ?? "Detected"}
                              </span>
                            ) : null}
                          </span>
                          {wallet.recent ? (
                            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-[color-mix(in_oklab,var(--primary)_80%,var(--foreground))]">
                              Recent
                            </span>
                          ) : null}
                        </DropdownMenu.Item>
                      ))}
                    </>
                  )}
                </motion.div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          ) : null}
        </AnimatePresence>
      </DropdownMenu.Root>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
