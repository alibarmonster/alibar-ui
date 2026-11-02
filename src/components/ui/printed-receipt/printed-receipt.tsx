"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/motion";
import { moneyFormat } from "@/lib/usage/format";

export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  /** Unit price in minor units (cents; sen for IDR). */
  price: number;
  /** A variant or note line, e.g. "340 g · light roast". */
  note?: string;
}

export interface ReceiptAdjustment {
  id: string;
  /** e.g. "Code BREWDAY" or "Shipping". */
  label: string;
  /** Minor units; negative for discounts. Discounts reduce the taxable amount, other adjustments do not. */
  amount: number;
}

export type ReceiptPayment =
  | { type: "card"; brand: string; lastFour: string }
  | { type: "crypto"; network: string; txHash: string; token: string; amount: string; gasFee: number };

export interface ReceiptOrder {
  number: string;
  /** ISO timestamp. */
  date: string;
  items: ReceiptItem[];
  adjustments?: ReceiptAdjustment[];
  /** Tax rate as a ratio (0.0725 is 7.25%), applied to items minus discounts. */
  taxRate?: number;
  payment: ReceiptPayment;
  delivery?: { method: string; to?: string };
}

export interface PrintedReceiptProps {
  /** The store printed at the top. */
  merchant: { name: string; address?: string[]; phone?: string };
  /** The order. Money is integer minor units. */
  order: ReceiptOrder;
  /** Stamp dropped on the total once printing finishes. @default "paid" */
  status?: "paid" | "pending" | "refunded";
  /** ISO 4217 currency. @default "USD" */
  currency?: string;
  /** Locale for money and dates. @default "en-US" */
  locale?: string;
  /** Time zone for the order date; fixed so server and browser agree. @default "UTC" */
  timeZone?: string;
  /** Change this value to print the receipt again from the start. */
  printKey?: string | number;
  /** Called when the paper has finished feeding out. */
  onPrinted?: () => void;
  /** Thank-you line at the bottom. @default "Thank you!" */
  footer?: string;
  /** Classes for the receipt. */
  className?: string;
}

const STAMP: Record<NonNullable<PrintedReceiptProps["status"]>, { label: string; color: string }> = {
  paid: { label: "Paid", color: "color-mix(in oklab, var(--success) 85%, var(--foreground))" },
  pending: { label: "Pending", color: "color-mix(in oklab, var(--warning) 85%, var(--foreground))" },
  refunded: { label: "Refunded", color: "color-mix(in oklab, var(--muted-foreground) 90%, var(--foreground))" },
};

/** Thermal printers feed in short bursts: move, pause, move. Returns y keyframes and their times. */
function feedSteps(steps: number) {
  const y: string[] = ["-100%"];
  const times: number[] = [0];
  for (let i = 1; i <= steps; i++) {
    const at = -100 + (100 * i) / steps;
    const t0 = (i - 1) / steps;
    y.push(`${at.toFixed(2)}%`, `${at.toFixed(2)}%`);
    times.push(t0 + 0.55 / steps, i / steps);
  }
  return { y, times };
}

/** A decorative barcode from the order number (not a scannable symbology). */
function Barcode({ value }: { value: string }) {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (const char of `*${value}*`) {
    const code = char.charCodeAt(0);
    for (let b = 0; b < 4; b++) {
      const w = 1 + ((code >> b) & 1) + ((code >> (b + 3)) & 1);
      bars.push({ x, w });
      x += w + 1 + ((code >> (b + 1)) & 1);
    }
  }
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${x} 40`} preserveAspectRatio="none" className="h-10 w-full">
      {bars.map((bar, i) => (
        <rect key={i} x={bar.x} y={0} width={bar.w} height={40} fill="currentColor" />
      ))}
    </svg>
  );
}

const Divider = () => <div aria-hidden="true" className="my-3 border-t border-dashed border-current opacity-35" />;

/**
 * An order receipt that feeds out of a thermal printer slot in short, jerky steps, on paper with a
 * torn zigzag edge. Once printed, a Paid, Pending or Refunded stamp drops onto the total. Change
 * `printKey` to print again.
 */
export function PrintedReceipt({
  merchant,
  order,
  status = "paid",
  currency = "USD",
  locale = "en-US",
  timeZone = "UTC",
  printKey,
  onPrinted,
  footer = "Thank you!",
  className,
}: PrintedReceiptProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const money = moneyFormat(currency, locale);
  const [printed, setPrinted] = useState(false);
  const [run, setRun] = useState(printKey);
  if (run !== printKey) {
    setRun(printKey);
    setPrinted(false);
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const adjustments = order.adjustments ?? [];
  const discounts = adjustments.filter((a) => a.amount < 0).reduce((sum, a) => sum + a.amount, 0);
  const tax = order.taxRate ? Math.round((subtotal + discounts) * order.taxRate) : 0;
  const total = subtotal + adjustments.reduce((sum, a) => sum + a.amount, 0) + tax;
  const date = new Date(order.date);
  const when = {
    day: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(date),
    time: new Intl.DateTimeFormat(locale, { timeStyle: "short", timeZone }).format(date),
  };
  const stamp = STAMP[status];
  const { y, times } = feedSteps(Math.max(8, Math.min(18, order.items.length * 2 + 6)));
  const feedDuration = 2.6 + order.items.length * 0.12;

  const finish = () => {
    setPrinted(true);
    onPrinted?.();
  };

  const row = "flex items-baseline justify-between gap-3";

  return (
    <div className={cn("relative w-full max-w-[19rem]", className)}>
      {/* The printer: a dark lip with a slit the paper feeds out of. */}
      <div aria-hidden="true" className="relative z-10 h-5 rounded-t-xl rounded-b-md bg-[#1f1f22] shadow-[0_6px_10px_-6px_rgb(0_0_0/0.5)]">
        <span className="absolute inset-x-4 bottom-1.5 h-1 rounded-full bg-black/80 shadow-[inset_0_1px_1px_rgb(0_0_0/0.8)]" />
        <span className="absolute top-1.5 right-3 size-1.5 rounded-full bg-[#4ade80] opacity-90" />
      </div>
      <div className="-mt-1.5 overflow-hidden px-3 pb-3">
        <motion.article
          key={String(printKey ?? "receipt")}
          aria-labelledby={`${id}-title`}
          aria-busy={!printed}
          initial={reduceMotion ? { opacity: 0, y: "0%" } : { y: "-100%" }}
          animate={reduceMotion ? { opacity: 1, y: "0%" } : { y }}
          transition={reduceMotion ? { duration: duration.slow } : { duration: feedDuration, times, ease: "easeOut" }}
          onAnimationComplete={finish}
          className="relative bg-[#fbf7ee] px-5 pt-6 pb-8 font-mono text-[12px] leading-5 text-[#2a2723] shadow-[0_10px_24px_-12px_rgb(0_0_0/0.35)]"
          style={{
            // Torn zigzag bottom edge.
            WebkitMaskImage: "conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg)",
            WebkitMaskSize: "12px 100%",
            WebkitMaskPosition: "50%",
            maskImage: "conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg)",
            maskSize: "12px 100%",
            maskPosition: "50%",
            backgroundImage:
              "repeating-linear-gradient(0deg, rgb(0 0 0 / 0.012) 0 1px, transparent 1px 3px), radial-gradient(circle at 30% 20%, rgb(0 0 0 / 0.02), transparent 60%)",
          }}
        >
          <header className="text-center">
            <h3 id={`${id}-title`} className="text-[13px] font-bold tracking-wide uppercase">
              {merchant.name}
            </h3>
            {merchant.address?.map((line) => (
              <p key={line} className="text-[11px] opacity-75">
                {line}
              </p>
            ))}
            {merchant.phone ? <p className="text-[11px] opacity-75">{merchant.phone}</p> : null}
          </header>
          <Divider />
          <div className={cn(row, "text-[11px]")}>
            <span>{when.day}</span>
            <span>{when.time}</span>
          </div>
          <div className={cn(row, "text-[11px]")}>
            <span>Order</span>
            <span className="font-semibold">#{order.number}</span>
          </div>
          <Divider />
          <ul className="space-y-1.5">
            {order.items.map((item) => (
              <li key={item.id}>
                <div className={row}>
                  <span className="min-w-0">{item.name}</span>
                  <span className="shrink-0 tabular-nums">{money.format(item.qty * item.price)}</span>
                </div>
                <p className="text-[11px] opacity-70">
                  {item.qty} × {money.format(item.price)}
                  {item.note ? ` · ${item.note}` : ""}
                </p>
              </li>
            ))}
          </ul>
          <Divider />
          <div className="space-y-0.5 tabular-nums">
            <div className={row}>
              <span>Subtotal</span>
              <span>{money.format(subtotal)}</span>
            </div>
            {adjustments.map((a) => (
              <div key={a.id} className={row}>
                <span>{a.label}</span>
                <span>{a.amount < 0 ? `−${money.format(-a.amount)}` : money.format(a.amount)}</span>
              </div>
            ))}
            {order.taxRate ? (
              <div className={row}>
                <span>Tax {(order.taxRate * 100).toFixed(order.taxRate * 100 % 1 ? 2 : 0)}%</span>
                <span>{money.format(tax)}</span>
              </div>
            ) : null}
          </div>
          <div className="relative mt-2 border-t-2 border-current pt-2">
            <div className={cn(row, "text-[15px] font-bold tabular-nums")}>
              <span>Total</span>
              <span className={cn("relative", status === "refunded" && printed && "line-through decoration-2")}>{money.format(total)}</span>
            </div>
            {printed ? (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-[30%] rounded-md border-[2.5px] px-2.5 py-0.5 font-sans text-[15px] font-black tracking-[0.18em] uppercase mix-blend-multiply"
                style={{ color: stamp.color, borderColor: stamp.color }}
                initial={reduceMotion ? { opacity: 0, rotate: -9, y: "-50%" } : { opacity: 0, scale: 1.9, rotate: -16, y: "-50%", filter: "blur(2px)" }}
                animate={{ opacity: 0.88, scale: 1, rotate: -9, y: "-50%", filter: "blur(0.3px)" }}
                transition={reduceMotion ? { duration: duration.base } : { type: "spring", stiffness: 420, damping: 18, mass: 0.8 }}
              >
                {stamp.label}
              </motion.span>
            ) : null}
          </div>
          <Divider />
          <div className="space-y-0.5 text-[11px]">
            {order.payment.type === "card" ? (
              <div className={row}>
                <span>Paid by</span>
                <span>
                  {order.payment.brand} •••• {order.payment.lastFour}
                </span>
              </div>
            ) : (
              <>
                <div className={row}>
                  <span>Network</span>
                  <span>{order.payment.network}</span>
                </div>
                <div className={row}>
                  <span>Paid</span>
                  <span>
                    {order.payment.amount} {order.payment.token}
                  </span>
                </div>
                <div className={row}>
                  <span>Gas fee</span>
                  <span className="tabular-nums">{money.format(order.payment.gasFee)}</span>
                </div>
                <div className={row}>
                  <span>Tx</span>
                  <span title={order.payment.txHash}>{`${order.payment.txHash.slice(0, 8)}…${order.payment.txHash.slice(-6)}`}</span>
                </div>
              </>
            )}
            {order.delivery ? (
              <>
                <div className={row}>
                  <span>Delivery</span>
                  <span className="text-right">{order.delivery.method}</span>
                </div>
                {order.delivery.to ? (
                  <div className={row}>
                    <span>To</span>
                    <span className="text-right">{order.delivery.to}</span>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          <Divider />
          <Barcode value={order.number} />
          <p className="mt-1 text-center text-[10px] tracking-[0.3em]">{order.number}</p>
          <p className="mt-3 text-center text-[12px] font-semibold">{footer}</p>
        </motion.article>
      </div>
      <p aria-live="polite" className="sr-only">
        {printed ? `Receipt printed. Total ${money.format(total)}, ${stamp.label.toLowerCase()}.` : ""}
      </p>
    </div>
  );
}
