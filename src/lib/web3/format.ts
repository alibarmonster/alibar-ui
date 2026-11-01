import { formatUnits, getAddress, isAddress, parseUnits } from "viem";

/**
 * Formatting for on-chain values. Amounts are always `bigint` plus `decimals`: nothing here
 * converts a balance to a float, so large or precise values never lose digits.
 */

/** Decimals used for USD values and prices across the web3 components (like Chainlink feeds). */
export const USD_DECIMALS = 8;

const COMPACT_UNITS = [
  { suffix: "T", exponent: 12 },
  { suffix: "B", exponent: 9 },
  { suffix: "M", exponent: 6 },
  { suffix: "K", exponent: 3 },
] as const;

function groupThousands(integer: string) {
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function compact(value: bigint, decimals: number): string | null {
  const base = BigInt(10) ** BigInt(decimals);
  for (const { suffix, exponent } of COMPACT_UNITS) {
    const unit = base * BigInt(10) ** BigInt(exponent);
    if (value < unit) continue;
    const tenths = (value * BigInt(10)) / unit;
    const whole = tenths / BigInt(10);
    const fraction = tenths % BigInt(10);
    return `${groupThousands(whole.toString())}${fraction && whole < BigInt(100) ? `.${fraction}` : ""}${suffix}`;
  }
  return null;
}

export interface FormatAmountOptions {
  /** Most fraction digits shown; extra digits are cut, never rounded up. @default 4 */
  maxFractionDigits?: number;
  /** Fraction digits always shown (padded with zeros). @default 0 */
  minFractionDigits?: number;
  /** Abbreviate values of 1,000 and up: 1.2K, 3.4M, 5B. @default false */
  compact?: boolean;
  /** Prefix positive values with "+". @default false */
  signed?: boolean;
}

/**
 * Formats a token amount: `formatAmount(parseUnits("1.23456789", 18), 18)` → "1.2345".
 * Digits past `maxFractionDigits` are truncated so a balance is never overstated, and a tiny
 * non-zero amount shows as "<0.0001" instead of "0".
 */
export function formatAmount(value: bigint, decimals: number, options: FormatAmountOptions = {}) {
  const { maxFractionDigits = 4, minFractionDigits = 0, compact: useCompact = false, signed = false } = options;
  const negative = value < BigInt(0);
  const abs = negative ? -value : value;
  const sign = negative ? "-" : signed && abs > BigInt(0) ? "+" : "";

  const short = useCompact ? compact(abs, decimals) : null;
  if (short) return sign + short;

  const [integer, fraction = ""] = formatUnits(abs, decimals).split(".");
  let digits = fraction.slice(0, maxFractionDigits).replace(/0+$/, "");
  if (digits.length < minFractionDigits) digits = digits.padEnd(minFractionDigits, "0");

  if (abs > BigInt(0) && integer === "0" && !/[1-9]/.test(digits)) {
    return `${sign}<0.${"0".repeat(Math.max(0, maxFractionDigits - 1))}1`;
  }
  return `${sign}${groupThousands(integer)}${digits ? `.${digits}` : ""}`;
}

/** USD value of a token amount, as a bigint with `USD_DECIMALS` decimals. `price` uses the same decimals. */
export function toUsd(amount: bigint, tokenDecimals: number, price: bigint) {
  return (amount * price) / BigInt(10) ** BigInt(tokenDecimals);
}

/** Formats a USD bigint (default `USD_DECIMALS`): "$1,234.56", or "$1.2M" with `compact`. */
export function formatUsd(value: bigint, decimals = USD_DECIMALS, options: Omit<FormatAmountOptions, "maxFractionDigits"> = {}) {
  const { compact: useCompact = false, signed = false } = options;
  const negative = value < BigInt(0);
  const abs = negative ? -value : value;
  const sign = negative ? "-" : signed && abs > BigInt(0) ? "+" : "";
  // Under a cent, keep up to 6 significant fraction digits so token prices like $0.000042 stay readable.
  const tiny = abs > BigInt(0) && abs < BigInt(10) ** BigInt(Math.max(0, decimals - 2));
  const body = formatAmount(abs, decimals, {
    compact: useCompact,
    maxFractionDigits: tiny ? Math.min(decimals, 8) : 2,
    minFractionDigits: tiny ? 0 : 2,
  });
  return `${sign}$${body}`;
}

/** Formats a ratio as a percentage: `formatPercent(0.0123)` → "1.23%". */
export function formatPercent(ratio: number, options: { fractionDigits?: number; signed?: boolean } = {}) {
  const { fractionDigits = 2, signed = false } = options;
  if (!Number.isFinite(ratio)) return "—";
  const text = `${(Math.abs(ratio) * 100).toFixed(fractionDigits)}%`;
  if (ratio < 0) return `-${text}`;
  return signed && ratio > 0 ? `+${text}` : text;
}

/** Formats basis points (1 bp = 0.01%): `formatBps(BigInt(50))` → "0.5%". */
export function formatBps(bps: bigint | number) {
  const value = BigInt(bps);
  const abs = value < BigInt(0) ? -value : value;
  const fraction = abs % BigInt(100);
  return `${value < BigInt(0) ? "-" : ""}${abs / BigInt(100)}${fraction ? `.${fraction.toString().padStart(2, "0").replace(/0$/, "")}` : ""}%`;
}

/** Compact display for plain counts and non-token numbers: 1200 → "1.2K". */
export function compactNumber(value: number | bigint) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** EIP-55 checksummed address, or the input unchanged when it isn't a valid address. */
export function checksumAddress(address: string) {
  return isAddress(address, { strict: false }) ? getAddress(address) : address;
}

/** "0x1234…abcd": checksummed, with `start` characters (including 0x) and `end` characters kept. */
export function truncateAddress(address: string, { start = 6, end = 4 }: { start?: number; end?: number } = {}) {
  const value = checksumAddress(address);
  if (value.length <= start + end + 1) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

/**
 * Parses user input into a bigint amount. Accepts digits with one "." (commas are ignored),
 * cuts fraction digits past `decimals`, and returns null for anything that isn't a number.
 */
export function parseAmount(input: string, decimals: number): bigint | null {
  const text = input.replace(/,/g, "").trim();
  if (!/^\d*\.?\d*$/.test(text) || text === "" || text === ".") return null;
  const [integer, fraction = ""] = text.split(".");
  return parseUnits(`${integer || "0"}.${fraction.slice(0, decimals) || "0"}`, decimals);
}

/** A percentage of an amount, in whole percent: `percentOf(balance, 25)`. Rounds down. */
export function percentOf(amount: bigint, percent: number) {
  return (amount * BigInt(Math.round(percent * 100))) / BigInt(10_000);
}
