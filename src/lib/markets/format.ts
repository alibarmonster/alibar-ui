import { FULL } from "@/lib/markets/math";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
// minimumFractionDigits: 0 matters: currency defaults to 2, and Node and browsers clamp it differently ("$412.0K" vs "$412K").
const usdCompact = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", minimumFractionDigits: 0, maximumFractionDigits: 1 });

/** "64%" (or "64.2%" with decimals). */
export const formatProbability = (bps: number, decimals = 0) => `${(bps / 100).toFixed(decimals)}%`;

/** "64¢". */
export const formatPrice = (bps: number) => `${Math.round(bps / 100)}¢`;

/** "$1,234.56", or "$1.2M" compact. Input in cents. */
export const formatUsd = (cents: number, compact = false) => (compact ? usdCompact.format(cents / 100) : usd.format(cents / 100));

/** Shares from hundredths: "156.25". */
export const formatShares = (hundredths: number) => (hundredths / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "▲ 4%" / "▼ 2.5%" from a basis-point change (never color alone: the arrow carries the direction). */
export function formatChange(bps: number) {
  const value = Math.abs(bps) / 100;
  return `${bps >= 0 ? "▲" : "▼"} ${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}%`;
}

/** Signed percent from basis points: "+56%". */
export const formatReturn = (bps: number) => `${bps >= 0 ? "+" : "−"}${(Math.abs(bps) / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;

/** "Ends in 3d 4h", "Ends in 42m" or "Ended". */
export function timeLeft(endsAt: number, now: number) {
  const ms = endsAt - now;
  if (ms <= 0) return "Ended";
  const minutes = Math.floor(ms / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `Ends in ${days}d ${hours}h`;
  if (hours > 0) return `Ends in ${hours}h ${minutes % 60}m`;
  return `Ends in ${Math.max(1, minutes)}m`;
}

/** A fixed, locale-stable date: "Mar 14, 2027". */
export const formatDate = (ms: number) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(ms);

export { FULL };
