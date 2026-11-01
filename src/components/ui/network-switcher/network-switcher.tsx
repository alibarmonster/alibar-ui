"use client";

import type { ComponentProps } from "react";
import { DropdownMenu } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, overlayVariants } from "@/lib/motion";
import { ChainIcon } from "@/lib/web3/icons";
import type { Chain } from "@/lib/web3/types";

export interface NetworkSwitcherProps
  extends Omit<ComponentProps<"div">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Networks your app supports. */
  chains: Chain[];
  /** The wallet's current chain id. An id missing from `chains` shows the wrong-network state. */
  chainId?: number;
  /** Called with the chain id the user picked. */
  onSwitch: (chainId: number) => void;
  /** Chain id a switch is in progress to; shows the switching state. */
  switchingTo?: number;
  /** Error from the last switch attempt, e.g. "Switch rejected in your wallet." */
  error?: string;
  /** Name of the unsupported network, shown in the warning. */
  unsupportedChainName?: string;
  /** Chain suggested by the warning banner. @default chains[0] */
  recommendedChainId?: number;
  /** Show the warning banner on a wrong network or error. @default true */
  showBanner?: boolean;
}

const Spinner = ({ className }: { className?: string }) => (
  <svg className={cn("size-4 animate-spin motion-reduce:animate-pulse", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const warningText = "text-[color-mix(in_oklab,var(--warning)_55%,var(--foreground))]";

export function NetworkSwitcher({
  chains,
  chainId,
  onSwitch,
  switchingTo,
  error,
  unsupportedChainName,
  recommendedChainId,
  showBanner = true,
  className,
  ...props
}: NetworkSwitcherProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const current = chains.find((c) => c.id === chainId);
  const target = chains.find((c) => c.id === switchingTo);
  const recommended = chains.find((c) => c.id === recommendedChainId) ?? chains[0];
  const switching = target !== undefined;
  const wrongNetwork = chainId !== undefined && !current;
  const bannerOpen = showBanner && !switching && (wrongNetwork || Boolean(error));
  const contentKey = switching ? `switching-${target.id}` : wrongNetwork ? "wrong" : (current?.id ?? "none");

  return (
    <div className={cn("flex flex-col items-start gap-3", className)} {...props}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-busy={switching || undefined}
          className={cn(
            "group inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border pr-3 pl-1.5 text-sm font-medium outline-none select-none",
            "transition-[background-color,border-color,color] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            wrongNetwork && !switching
              ? cn("border-warning/40 bg-warning/10 pl-3", warningText)
              : "border-border bg-background text-foreground shadow-xs hover:bg-surface",
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={contentKey}
              className="flex items-center gap-2"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: duration.quick, ease: ease.out }}
            >
              {switching ? (
                <>
                  <span className="grid size-7 place-items-center">
                    <Spinner className="text-muted-foreground" />
                  </span>
                  Switching to {target.shortName ?? target.name}…
                </>
              ) : wrongNetwork ? (
                <>
                  <AlertTriangle className="size-4" aria-hidden="true" />
                  Wrong network
                </>
              ) : current ? (
                <>
                  <ChainIcon chain={current} size={28} />
                  <span>
                    <span className="sr-only">Network: </span>
                    {current.shortName ?? current.name}
                  </span>
                </>
              ) : (
                <span className="pl-1.5">Select network</span>
              )}
            </motion.span>
          </AnimatePresence>
          <ChevronDown className="size-4 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="start" sideOffset={8} collisionPadding={12} asChild>
            <motion.div
              variants={overlayVariants(reduceMotion)}
              initial="hidden"
              animate="visible"
              className="z-50 w-60 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg outline-none"
            >
              <DropdownMenu.Label className="px-2.5 pt-1.5 pb-2 text-xs font-medium text-muted-foreground">Networks</DropdownMenu.Label>
              <DropdownMenu.RadioGroup value={chainId !== undefined ? String(chainId) : undefined} onValueChange={(v) => onSwitch(Number(v))}>
                {chains.map((chain) => {
                  const active = chain.id === chainId;
                  const pending = chain.id === switchingTo;
                  return (
                    <DropdownMenu.RadioItem
                      key={chain.id}
                      value={String(chain.id)}
                      disabled={switching}
                      className="flex h-10 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-sm text-foreground outline-none transition-colors data-[disabled]:cursor-progress data-[highlighted]:bg-accent"
                    >
                      <ChainIcon chain={chain} size={22} />
                      <span className="flex-1 truncate">{chain.name}</span>
                      {pending ? (
                        <Spinner className="text-muted-foreground" />
                      ) : active ? (
                        <Check className="size-4 text-foreground" aria-hidden="true" />
                      ) : null}
                    </DropdownMenu.RadioItem>
                  );
                })}
              </DropdownMenu.RadioGroup>
            </motion.div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Height opens with the grid-rows trick, so nothing below jumps. */}
      <div
        className={cn(
          "grid w-full transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
          bannerOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        aria-hidden={!bannerOpen}
        inert={!bannerOpen}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            role={bannerOpen ? "alert" : undefined}
            className={cn(
              "flex flex-col gap-3 rounded-xl border p-3.5 text-[13px] leading-5 sm:flex-row sm:items-center",
              error ? "border-destructive/25 bg-destructive/6" : "border-warning/35 bg-warning/8",
            )}
          >
            <AlertTriangle
              className={cn("size-4 shrink-0", error ? "text-[color-mix(in_oklab,var(--destructive)_80%,var(--foreground))]" : warningText)}
              aria-hidden="true"
            />
            <p className="flex-1 text-foreground">
              {error ? (
                error
              ) : (
                <>
                  <span className="font-medium">
                    {unsupportedChainName ? `${unsupportedChainName} isn't supported.` : "This network isn't supported."}
                  </span>{" "}
                  Switch to {recommended?.name} to continue.
                </>
              )}
            </p>
            {recommended ? (
              <button
                type="button"
                onClick={() => onSwitch(recommended.id)}
                className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 self-start rounded-lg bg-foreground px-3 text-[13px] font-medium text-background outline-none transition-colors hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:self-auto"
              >
                <ChainIcon chain={recommended} size={18} />
                {error ? "Try again" : `Switch to ${recommended.shortName ?? recommended.name}`}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {switching ? `Switching to ${target.name}` : current ? `Connected to ${current.name}` : ""}
      </span>
    </div>
  );
}
