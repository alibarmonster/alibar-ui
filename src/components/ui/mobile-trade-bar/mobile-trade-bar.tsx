"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, LayoutGroup, motion, useDragControls, useReducedMotion, type PanInfo } from "motion/react";
import { cn } from "@/lib/utils";
import { TradeTicket } from "@/components/ui/trade-ticket/trade-ticket";
import { formatPrice, formatProbability } from "@/lib/markets/format";
import { complement } from "@/lib/markets/math";
import type { Market } from "@/lib/markets/types";
import { RollingValue } from "@/lib/web3/rolling-value";

export interface MobileTradeBarProps {
  /** A binary market (multi-outcome markets trade their leading outcome). */
  market: Market;
  /** Scrolling element that hides and shows the bar; defaults to the window. */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** Pin to the nearest positioned ancestor instead of the viewport (for previews and phone frames). @default false */
  contained?: boolean;
  /** Simulated balance passed to the ticket, in cents. @default 50000 */
  balance?: number;
  /** Classes for the bar. */
  className?: string;
}

const layoutKey = (id: string, side: "yes" | "no") => `mobile-bar-${id}-${side}`;

/**
 * A sticky bottom bar for phones with the market's odds and Yes/No buttons. It hides while you
 * scroll down and returns when you scroll up; a button expands into a bottom sheet with the
 * Trade Ticket, which snaps between two heights and drags down to dismiss.
 */
export function MobileTradeBar({ market, scrollContainer, contained = false, balance = 50000, className }: MobileTradeBarProps) {
  const reduceMotion = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [sheet, setSheet] = useState<"yes" | "no" | null>(null);
  const [tall, setTall] = useState(false);
  const dragControls = useDragControls();
  // The opener unmounts while the sheet is open (its layoutId morphs into the sheet), so focus is
  // returned to whichever button is mounted for that side after closing.
  const buttons = useRef<Partial<Record<"yes" | "no", HTMLButtonElement | null>>>({});
  const lastSide = useRef<"yes" | "no">("yes");
  const sheetRef = useRef<HTMLDivElement>(null);
  const leader = [...market.outcomes].sort((a, b) => b.price - a.price)[0];
  const yesPrice = market.type === "binary" ? market.outcomes[0].price : leader.price;

  // Hide on scroll down, show on scroll up.
  useEffect(() => {
    const target: HTMLElement | Window = scrollContainer?.current ?? window;
    let last = "scrollY" in target ? target.scrollY : target.scrollTop;
    const onScroll = () => {
      const y = "scrollY" in target ? target.scrollY : target.scrollTop;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > 40);
      last = y;
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [scrollContainer]);

  useEffect(() => {
    if (!sheet) return;
    sheetRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSheet(null);
      setTall(false);
      requestAnimationFrame(() => buttons.current[lastSide.current]?.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const close = () => {
    setSheet(null);
    setTall(false);
    requestAnimationFrame(() => buttons.current[lastSide.current]?.focus());
  };
  const dragged = useRef(false);
  const onDragEnd = (_: unknown, info: PanInfo) => {
    dragged.current = Math.abs(info.offset.y) > 4;
    if (info.offset.y > 120 || info.velocity.y > 600) close();
    else if (info.offset.y < -60 || info.velocity.y < -500) setTall(true);
    else if (info.offset.y > 60) setTall(false);
  };

  const position = contained ? "absolute" : "fixed";
  return (
    <LayoutGroup>
      <motion.div
        animate={{ y: hidden && !sheet ? "130%" : "0%" }}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 36 }}
        className={cn(position, "inset-x-3 bottom-3 z-30 flex items-center gap-2 rounded-2xl border border-border bg-background/95 p-2 pl-3 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.35)] backdrop-blur", className)}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] text-muted-foreground">{market.question}</p>
          <p className="text-sm font-semibold text-foreground tabular-nums">
            <RollingValue value={formatProbability(yesPrice)} trend={yesPrice} /> <span className="text-[12px] font-normal text-muted-foreground">{market.type === "binary" ? "chance" : leader.name}</span>
          </p>
        </div>
        {(["yes", "no"] as const).map((side) =>
          sheet === side ? (
            <span key={side} className="h-10 w-[4.5rem]" />
          ) : (
            <motion.button
              key={side}
              ref={(node: HTMLButtonElement | null) => {
                buttons.current[side] = node;
              }}
              layoutId={layoutKey(market.id, side)}
              type="button"
              onClick={() => {
                lastSide.current = side;
                setSheet(side);
              }}
              className={cn("h-10 w-[4.5rem] shrink-0 cursor-pointer rounded-xl text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", side === "yes" ? "bg-success/12 text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]" : "bg-destructive/10 text-[color-mix(in_oklab,var(--destructive)_75%,var(--foreground))]")}
            >
              {side === "yes" ? "Yes" : "No"} {formatPrice(side === "yes" ? yesPrice : complement(yesPrice))}
            </motion.button>
          ),
        )}
      </motion.div>
      <AnimatePresence>
        {sheet ? (
          <>
            <motion.div key="backdrop" aria-hidden="true" className={cn(position, "inset-0 z-40 bg-black/30")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
            <motion.div
              key="sheet"
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="Trade"
              tabIndex={-1}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.1, bottom: 0.8 }}
              onDragEnd={onDragEnd}
              initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              className={cn(position, "inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-background shadow-2xl outline-none", tall ? "h-[92%]" : "h-[68%]")}
            >
              <button
                type="button"
                aria-label={tall ? "Shrink sheet (or drag down to close)" : "Expand sheet (or drag up)"}
                onPointerDown={(event) => dragControls.start(event)}
                onClick={() => {
                  // A drag that ends on the handle also fires click; only a tap toggles.
                  if (dragged.current) dragged.current = false;
                  else setTall((t) => !t);
                }}
                className="flex h-10 w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-t-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:cursor-grabbing"
              >
                <span className="h-1.5 w-10 rounded-full bg-foreground/20" />
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                <TradeTicket market={market} outcomeId={market.type === "binary" ? market.outcomes[0].id : leader.id} choice={sheet} balance={balance} layoutId={layoutKey(market.id, sheet)} onClose={close} className="mx-auto max-w-none border-0 shadow-none" />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </LayoutGroup>
  );
}
