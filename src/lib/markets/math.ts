/**
 * Prediction market math on integers only: prices in basis points (10000 = $1.00 = 100%), money in
 * cents and shares in hundredths. A share pays $1 (100 cents) if its outcome wins.
 */
export const FULL = 10000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The other side of a binary price: Yes + No = 100¢. */
export const complement = (price: number) => FULL - price;

/** Shares (in hundredths) that `amount` cents buys at `price` basis points. */
export const sharesFor = (amount: number, price: number) => (price > 0 ? Math.floor((amount * FULL) / price) : 0);

/** Payout in cents if those shares win: each share pays 100 cents, so hundredths of a share map 1:1 to cents. */
export const payoutFor = (shares: number) => shares;

/** Value in cents of shares (hundredths) at a price. */
export const valueOf = (shares: number, price: number) => Math.floor((shares * price) / FULL);

export interface BuyQuote {
  /** Average fill price, basis points. */
  averagePrice: number;
  /** Price after the trade, basis points. */
  newPrice: number;
  /** Price impact, basis points (newPrice − price). */
  impact: number;
  /** Shares received, hundredths. */
  shares: number;
  /** Payout if it wins, cents. */
  payout: number;
  /** Return if it wins, basis points of the amount (5600 = +56%). */
  returnBps: number;
}

/**
 * A simulated buy against a constant-product style curve: the more of the pool you take, the further
 * the price moves toward $1. Good enough to show impact and average price in a demo.
 */
export function quoteBuy(price: number, amount: number, liquidity: number): BuyQuote {
  const p = clamp(Math.round(price), 1, FULL - 1);
  if (amount <= 0) return { averagePrice: p, newPrice: p, impact: 0, shares: 0, payout: 0, returnBps: 0 };
  const take = Math.floor((amount * FULL) / (amount + Math.max(1, liquidity)));
  const newPrice = clamp(p + Math.floor(((FULL - p) * take) / FULL), 1, FULL - 1);
  const averagePrice = Math.floor((p + newPrice) / 2);
  const shares = sharesFor(amount, averagePrice);
  const payout = payoutFor(shares);
  return { averagePrice, newPrice, impact: newPrice - p, shares, payout, returnBps: Math.floor(((payout - amount) * FULL) / amount) };
}

/** A simulated limit buy: fills entirely at the limit price, no impact. */
export function quoteLimit(limitPrice: number, amount: number): BuyQuote {
  const p = clamp(Math.round(limitPrice), 1, FULL - 1);
  const shares = sharesFor(Math.max(0, amount), p);
  return { averagePrice: p, newPrice: p, impact: 0, shares, payout: shares, returnBps: amount > 0 ? Math.floor(((shares - amount) * FULL) / amount) : 0 };
}

/** Proceeds in cents from selling shares (hundredths), with the price sliding toward 0 by the same curve. */
export function quoteSell(price: number, shares: number, liquidity: number) {
  const p = clamp(Math.round(price), 1, FULL - 1);
  const gross = valueOf(shares, p);
  const take = Math.floor((gross * FULL) / (gross + Math.max(1, liquidity)));
  const newPrice = clamp(p - Math.floor((p * take) / FULL), 1, FULL - 1);
  const averagePrice = Math.floor((p + newPrice) / 2);
  return { proceeds: valueOf(shares, averagePrice), averagePrice, newPrice, impact: newPrice - p };
}

/** Profit and loss in cents for shares bought at an average price, marked at the current price. */
export function profitAndLoss(shares: number, averagePrice: number, currentPrice: number) {
  const cost = valueOf(shares, averagePrice);
  const value = valueOf(shares, currentPrice);
  return { cost, value, pnl: value - cost, pnlBps: cost ? Math.floor(((value - cost) * FULL) / cost) : 0 };
}

/** Scales positive weights so they sum to exactly 10000 (rounding error goes to the largest). */
export function normalize(prices: number[]) {
  const total = prices.reduce((sum, p) => sum + Math.max(0, p), 0) || 1;
  const scaled = prices.map((p) => Math.floor((Math.max(0, p) * FULL) / total));
  const rest = FULL - scaled.reduce((sum, p) => sum + p, 0);
  const largest = scaled.indexOf(Math.max(...scaled));
  if (largest >= 0) scaled[largest] += rest;
  return scaled;
}
