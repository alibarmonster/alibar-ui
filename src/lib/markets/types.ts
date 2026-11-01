/** Prices and probabilities are integer basis points (0–10000: 6400 = 64% = 64¢), money is integer cents. */
export type MarketStatus = "open" | "closing" | "resolved";

export interface MarketOutcome {
  id: string;
  name: string;
  /** Price in basis points (0–10000). Binary markets: Yes + No always sum to 10000. */
  price: number;
  /** 24h change in basis points (positive = up). */
  change24h?: number;
  /** Avatar or icon image for the outcome. */
  image?: string;
  /** Volume traded on this outcome, in cents. */
  volume?: number;
}

export interface PricePoint {
  /** Timestamp, ms. */
  t: number;
  /** Price per outcome, in basis points, same order as outcomes. */
  prices: number[];
}

export interface Market {
  id: string;
  question: string;
  /** Topic label, e.g. "Tech". */
  topic: string;
  /** Market image URL; a generated icon is used without one. */
  image?: string;
  type: "binary" | "multi";
  /** Binary markets: [Yes, No]. Multi-outcome: probabilities normalized to 10000. */
  outcomes: MarketOutcome[];
  /** Total volume, cents. */
  volume: number;
  /** Simulated liquidity used for price impact, cents. */
  liquidity: number;
  traders: number;
  /** Names of a few traders, for the avatar group. */
  traderNames?: string[];
  /** End time, ms since epoch. */
  endsAt: number;
  status: MarketStatus;
  /** Winning outcome once resolved. */
  resolvedOutcomeId?: string;
  comments?: number;
  history?: PricePoint[];
  rules?: string;
  resolutionSource?: { label: string; href: string };
}

export type TradeSide = "buy" | "sell";
