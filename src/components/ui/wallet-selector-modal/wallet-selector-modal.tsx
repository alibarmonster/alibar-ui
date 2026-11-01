"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertCircle, ArrowLeft, Check, ChevronRight, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, overlayVariants, spring } from "@/lib/motion";
import { WalletIcon } from "@/lib/web3/icons";
import type { WalletOption } from "@/lib/web3/types";

export type WalletSelectorView = "list" | "qr";

export interface WalletSelectorModalProps {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. @default false */
  defaultOpen?: boolean;
  /** Called when the dialog opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the dialog. */
  trigger?: ReactNode;
  /** Wallets to offer. Wallets with `qr` open the QR view. */
  wallets: WalletOption[];
  /** Called with the wallet id the user picked. */
  onSelect: (walletId: string) => void;
  /** State of the picked wallet's connection. @default "idle" */
  status?: "idle" | "connecting" | "error";
  /** The wallet the user picked, shown with a spinner or error. */
  selectedWalletId?: string;
  /** Controlled view. */
  view?: WalletSelectorView;
  /** Called when the view changes (picking a QR wallet, or going back). */
  onViewChange?: (view: WalletSelectorView) => void;
  /** Connection URI encoded in the QR view, also offered by "Copy link". */
  qrValue?: string;
  /** Renders a scannable QR code for qrValue. Without it, a decorative placeholder pattern is drawn. */
  renderQrCode?: (value: string) => ReactNode;
  /** Dialog title. @default "Connect a wallet" */
  title?: string;
  /** Message shown when status is "error". @default "Request rejected in your wallet." */
  errorMessage?: string;
}

const QR_SIZE = 25;

/** Module path of a decorative, deterministic QR-like pattern (not scannable). */
function qrModules(value: string) {
  let seed = 0x811c9dc5;
  for (const char of value) seed = Math.imul(seed ^ char.charCodeAt(0), 0x01000193);
  const random = () => {
    seed = Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d);
    seed = Math.imul(seed ^ (seed >>> 12), 0x297a2d39);
    seed ^= seed >>> 15;
    return (seed >>> 0) / 4294967296;
  };
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > QR_SIZE - 9 && y < 8) || (x < 8 && y > QR_SIZE - 9);
  const inLogo = (x: number, y: number) => Math.abs(x - 12) <= 3 && Math.abs(y - 12) <= 3;
  let d = "";
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      if (random() > 0.52 && !inFinder(x, y) && !inLogo(x, y)) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return d;
}

function QrPattern({ value }: { value: string }) {
  const size = QR_SIZE;
  const d = qrModules(value);
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x + 0.5} y={y + 0.5} width="6" height="6" rx="1.6" fill="none" stroke="currentColor" />
      <rect x={x + 2} y={y + 2} width="3" height="3" rx="0.8" fill="currentColor" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} className="size-full" aria-hidden="true" shapeRendering="crispEdges">
      <path d={d} fill="currentColor" />
      <g shapeRendering="geometricPrecision">{[finder(0, 0), finder(size - 7, 0), finder(0, size - 7)]}</g>
    </svg>
  );
}

const rowClass =
  "group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-progress";

export function WalletSelectorModal({
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  wallets,
  onSelect,
  status = "idle",
  selectedWalletId,
  view,
  onViewChange,
  qrValue = "wc:alibar-demo@2?relay-protocol=irn",
  renderQrCode,
  title = "Connect a wallet",
  errorMessage = "Request rejected in your wallet.",
}: WalletSelectorModalProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalView, setInternalView] = useState<WalletSelectorView>("list");
  const [qrWalletId, setQrWalletId] = useState<string>();
  const [copied, setCopied] = useState(false);
  const isOpen = open ?? internalOpen;
  const currentView = view ?? internalView;
  const qrWallet = wallets.find((w) => w.id === (qrWalletId ?? selectedWalletId)) ?? wallets.find((w) => w.qr);

  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) setView("list");
  };
  const setView = (next: WalletSelectorView) => {
    if (view === undefined) setInternalView(next);
    onViewChange?.(next);
  };

  function pick(wallet: WalletOption) {
    onSelect(wallet.id);
    if (wallet.qr) {
      setQrWalletId(wallet.id);
      setView("qr");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(qrValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable; nothing to undo.
    }
  }

  const direction = currentView === "qr" ? 1 : -1;
  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 24 * direction, filter: "blur(4px)" },
        animate: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: { opacity: 0, x: -24 * direction, filter: "blur(4px)" },
      };

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
                  className="pointer-events-auto w-full max-w-sm overflow-hidden border border-border bg-popover text-popover-foreground shadow-xl outline-none"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={currentView}
                      variants={slide}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: duration.base, ease: ease.out }}
                      className="p-2"
                    >
                      <div className="flex h-12 items-center gap-2 pr-1 pl-3">
                        {currentView === "qr" ? (
                          <button
                            type="button"
                            onClick={() => setView("list")}
                            aria-label="Back to wallets"
                            className="-ml-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                          </button>
                        ) : null}
                        <Dialog.Title className="flex-1 text-base font-semibold tracking-tight text-foreground">
                          {currentView === "qr" ? `Scan with ${qrWallet?.name ?? "your phone"}` : title}
                        </Dialog.Title>
                        <Dialog.Close
                          aria-label="Close"
                          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </Dialog.Close>
                      </div>

                      {currentView === "list" ? (
                        <ul className="space-y-0.5 pb-1">
                          {wallets.map((wallet) => {
                            const active = wallet.id === selectedWalletId;
                            const connecting = active && status === "connecting";
                            const failed = active && status === "error";
                            return (
                              <li key={wallet.id}>
                                <button
                                  type="button"
                                  onClick={() => pick(wallet)}
                                  disabled={status === "connecting"}
                                  aria-busy={connecting || undefined}
                                  className={cn(rowClass, active && status !== "idle" && "bg-accent")}
                                >
                                  <WalletIcon wallet={wallet} size={36} />
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                                      <span className="truncate">{wallet.name}</span>
                                      {wallet.recent ? (
                                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-[color-mix(in_oklab,var(--primary)_80%,var(--foreground))]">
                                          Recent
                                        </span>
                                      ) : null}
                                    </span>
                                    <span
                                      className={cn(
                                        "block truncate text-xs",
                                        failed ? "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]" : "text-muted-foreground",
                                      )}
                                    >
                                      {connecting
                                        ? "Confirm in your wallet…"
                                        : failed
                                          ? errorMessage
                                          : (wallet.description ?? (wallet.installed ? "Detected in this browser" : "Not installed"))}
                                    </span>
                                  </span>
                                  {connecting ? (
                                    <svg className="size-4 animate-spin text-muted-foreground motion-reduce:animate-pulse" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
                                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                  ) : failed ? (
                                    <AlertCircle className="size-4 text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]" aria-hidden="true" />
                                  ) : (
                                    <ChevronRight
                                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                                      aria-hidden="true"
                                    />
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="flex flex-col items-center px-4 pt-2 pb-4">
                          <div className="relative aspect-square w-full max-w-60 rounded-2xl border border-border bg-background p-4 text-foreground">
                            {renderQrCode ? renderQrCode(qrValue) : <QrPattern value={qrValue} />}
                            {qrWallet ? (
                              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background p-1">
                                <WalletIcon wallet={qrWallet} size={34} />
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-4 text-center text-[13px] leading-5 text-muted-foreground">
                            Open the wallet app on your phone and scan this code to connect.
                          </p>
                          <button
                            type="button"
                            onClick={copyLink}
                            className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {copied ? <Check className="size-3.5 text-success" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                            {copied ? "Link copied" : "Copy link"}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <span className="sr-only" role="status" aria-live="polite">
                    {status === "connecting" ? "Waiting for confirmation in your wallet" : status === "error" ? errorMessage : ""}
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
