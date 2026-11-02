/**
 * Money formatting for usage and billing. Amounts are integer minor units (cents; sen for IDR).
 * IDR is shown without decimals. Locales are fixed by the caller, never read from the browser,
 * so server and client output match.
 */
const NO_DECIMALS = new Set(["IDR", "JPY", "KRW", "VND"]);

export function moneyFormat(currency = "USD", locale = "en-US") {
  const decimals = NO_DECIMALS.has(currency) ? 0 : 2;
  const options = { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals } as const;
  const full = new Intl.NumberFormat(locale, options);
  const compact = new Intl.NumberFormat(locale, { style: "currency", currency, notation: "compact", minimumFractionDigits: 0, maximumFractionDigits: 1 });
  return {
    currency,
    locale,
    decimals,
    /** "$55.80", "Rp 892.800". */
    format: (minor: number) => full.format(minor / 100),
    /** "$1.2K", "Rp 1,2 jt". */
    compact: (minor: number) => compact.format(minor / 100),
    /** Props for RollingDigits so totals roll instead of swapping. */
    rolling: (minor: number) => ({ value: minor / 100, decimals, format: options, locale }),
  };
}

export type MoneyFormat = ReturnType<typeof moneyFormat>;

/** "427,200" in the given locale. */
export const formatCredits = (credits: number, locale = "en-US") => new Intl.NumberFormat(locale).format(Math.round(credits));

/** Compact credits: "12.4K". */
export const formatCreditsCompact = (credits: number, locale = "en-US") => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(credits);

/** A ratio as a percent: 0.558 → "56%". */
export const formatShare = (ratio: number, digits = 0) => `${(ratio * 100).toFixed(digits)}%`;

/** A fixed, locale-stable date in UTC: "Nov 15" or "Nov 15, 2026". */
export function formatDay(iso: string, withYear = false, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}
