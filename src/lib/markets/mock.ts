import { useEffect, useState } from "react";
import { FULL, normalize } from "@/lib/markets/math";
import type { Market, MarketOutcome, PricePoint } from "@/lib/markets/types";

/**
 * Demo-only prediction market data: fictional markets, traders, history, order books, comments,
 * positions and a leaderboard, plus a tick engine. Everything is simulated; nothing touches a real
 * market, wallet or RPC. Not part of the registry.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const mockTraders = ["nova", "raka", "maya", "lena", "ozzy", "kiri", "taro", "juno", "alibar", "sefa", "pell", "wren"].map((name) => `@${name}`);

const HOUR = 3600_000;
const DAY = 24 * HOUR;
// Relative to page load, so countdowns always look current (only rendered after hydration).
const base = Date.now();

type Seed = [id: string, question: string, topic: string, outcomes: [string, number][], volume: number, traders: number, endsIn: number, status?: Market["status"], resolved?: string];

const seeds: Seed[] = [
  ["fusion-demo", "Will a fusion startup show net energy gain before July?", "Science", [["Yes", 3400], ["No", 6600]], 412_000_00, 2841, 64 * DAY],
  ["glass-phone", "Will a foldable glass phone ship this year?", "Tech", [["Yes", 6400], ["No", 3600]], 1_204_500_00, 9120, 41 * DAY],
  ["harbor-cup", "Who wins the Harbor Cup final?", "Sports", [["Northwind FC", 4100], ["Atlas United", 3300], ["Ferry Town", 1500], ["Lowland Rovers", 700], ["Others", 400]], 3_880_000_00, 15402, 9 * DAY],
  ["monsoon-early", "Will the monsoon arrive before June 1?", "Weather", [["Yes", 5800], ["No", 4200]], 96_300_00, 744, 5 * HOUR, "closing"],
  ["film-award", "Best Picture at the Lantern Awards?", "Culture", [["Paper Moons", 3800], ["The Quiet Engine", 2600], ["Salt Season", 2100], ["Kite Weather", 1500]], 2_210_000_00, 11873, 23 * DAY],
  ["nova-200", "Will NOVA close above $2.00 on Friday?", "Crypto", [["Yes", 2700], ["No", 7300]], 640_800_00, 4033, 3 * DAY],
  ["rover-signal", "Will the Kestrel rover send color images by March?", "Science", [["Yes", 7700], ["No", 2300]], 158_900_00, 1290, 88 * DAY],
  ["ai-chess", "Will an open model beat the chess champion in a public match?", "Tech", [["Yes", 4600], ["No", 5400]], 880_200_00, 6611, 120 * DAY],
  ["marathon-record", "Will the city marathon record fall this year?", "Sports", [["Yes", 2200], ["No", 7800]], 74_600_00, 512, 32 * DAY],
  ["snow-new-year", "Snow in the capital on New Year's Day?", "Weather", [["Yes", 1800], ["No", 8200]], 58_100_00, 388, 59 * DAY],
  ["album-week", "Will the new Juno Areld album debut at number one?", "Culture", [["Yes", 10000], ["No", 0]], 302_000_00, 2804, -2 * DAY, "resolved", "Yes"],
  ["layer-fees", "Which network has the lowest median fee in Q1?", "Crypto", [["Lumen Chain", 4500], ["Relay", 3100], ["Keystone L2", 2400]], 1_020_000_00, 5120, 47 * DAY],
];

function history(prices: number[], seed: number, points = 96, span = 30 * DAY): PricePoint[] {
  const random = mulberry32(seed);
  const series: PricePoint[] = [];
  let current = prices.map((p) => Math.max(200, Math.min(9800, p + (random() - 0.5) * 2400)));
  for (let i = 0; i < points; i++) {
    const t = base - span + (span * i) / (points - 1);
    current = current.map((p, k) => Math.max(100, Math.min(9900, p + (random() - 0.5) * 500 + (prices[k] - p) * 0.06)));
    const next = i === points - 1 ? prices : current;
    series.push({ t, prices: prices.length === 2 ? [Math.round(next[0]), FULL - Math.round(next[0])] : normalize(next) });
  }
  return series;
}

export const mockMarkets: Market[] = seeds.map(([id, question, topic, entries, volume, traders, endsIn, status = "open", resolved], i) => {
  const random = mulberry32(i * 97 + 13);
  const outcomes: MarketOutcome[] = entries.map(([name, price], k) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    price,
    change24h: Math.round((random() - 0.45) * 900),
    volume: Math.round((volume * (k === 0 ? 0.6 : 0.4 / entries.length)) / 100) * 100,
  }));
  return {
    id,
    question,
    topic,
    type: entries.length === 2 ? "binary" : "multi",
    outcomes,
    volume,
    liquidity: Math.round(volume / 9),
    traders,
    traderNames: mockTraders.slice(i % 6, (i % 6) + 4),
    endsAt: base + endsIn,
    status,
    resolvedOutcomeId: resolved ? resolved.toLowerCase() : undefined,
    comments: Math.round(traders / 18),
    history: history(entries.map(([, p]) => p), i + 1),
    rules: `This market resolves to the outcome reported by the official source at the end time. If the event is cancelled or the source does not report a result within 7 days, the market resolves to an even split. Fictional market for demonstration only.`,
    resolutionSource: { label: "Official results page (fictional)", href: "#resolution-source" },
  };
});

export const getMockMarket = (id: string) => mockMarkets.find((m) => m.id === id) ?? mockMarkets[0];

/** Mock order book around a price: bids below, asks above, sizes in shares (hundredths). */
export function mockOrderBook(price: number, seed = 1) {
  const random = mulberry32(seed);
  const level = (offset: number) => ({ price: Math.max(100, Math.min(9900, price + offset * 100)), shares: Math.round((400 + random() * 5200) * 100) });
  return {
    bids: Array.from({ length: 8 }, (_, i) => level(-(i + 1))),
    asks: Array.from({ length: 8 }, (_, i) => level(i + 1)),
  };
}

export interface MockTrade {
  id: string;
  trader: string;
  side: "buy" | "sell";
  outcome: string;
  shares: number;
  price: number;
  at: number;
}

let tradeCounter = 0;
export function mockTrade(market: Market, random = Math.random): MockTrade {
  const outcome = market.outcomes[Math.floor(random() * Math.min(market.outcomes.length, 3))];
  tradeCounter += 1;
  return {
    id: `trade-${tradeCounter}-${Math.round(random() * 1e6)}`,
    trader: mockTraders[Math.floor(random() * mockTraders.length)],
    side: random() > 0.35 ? "buy" : "sell",
    outcome: outcome.name,
    shares: Math.round((5 + random() * (random() > 0.9 ? 4000 : 400)) * 100),
    price: outcome.price,
    at: Date.now() - Math.round(random() * 60000),
  };
}

export const mockTrades = (market: Market, count = 8) => {
  const random = mulberry32(market.id.length * 31);
  return Array.from({ length: count }, () => mockTrade(market, random)).sort((a, b) => b.at - a.at);
};

export interface MockComment {
  id: string;
  author: string;
  position?: { outcome: string; shares: number };
  text: string;
  likes: number;
  ago: string;
  replies?: MockComment[];
}

export const mockComments: MockComment[] = [
  { id: "c1", author: "@maya", position: { outcome: "Yes", shares: 34000 }, text: "The supplier report last week makes this look likely. Holding.", likes: 42, ago: "2h", replies: [{ id: "c1r1", author: "@ozzy", position: { outcome: "No", shares: 12000 }, text: "Reports have been wrong twice this year. Too early.", likes: 9, ago: "1h" }] },
  { id: "c2", author: "@raka", position: { outcome: "No", shares: 88000 }, text: "Priced way too high. Production delays are not in the odds yet.", likes: 27, ago: "4h" },
  { id: "c3", author: "@lena", text: "Anyone have the resolution source link? The rules mention an official page.", likes: 6, ago: "6h", replies: [{ id: "c3r1", author: "@kiri", text: "It's in the Rules section below the chart.", likes: 3, ago: "5h" }] },
  { id: "c4", author: "@nova", position: { outcome: "Yes", shares: 152000 }, text: "Added more on the dip. This is the cleanest setup on the board.", likes: 61, ago: "9h" },
];

export interface MockPosition {
  marketId: string;
  outcomeId: string;
  shares: number;
  averagePrice: number;
  status: "open" | "won" | "lost" | "closed";
  claimed?: boolean;
  realized?: number;
}

export const mockPositions: MockPosition[] = [
  { marketId: "glass-phone", outcomeId: "yes", shares: 15600, averagePrice: 5100, status: "open" },
  { marketId: "harbor-cup", outcomeId: "northwind-fc", shares: 42000, averagePrice: 3600, status: "open" },
  { marketId: "nova-200", outcomeId: "no", shares: 22000, averagePrice: 7600, status: "open" },
  { marketId: "album-week", outcomeId: "yes", shares: 18000, averagePrice: 4200, status: "won" },
  { marketId: "snow-new-year", outcomeId: "yes", shares: 9000, averagePrice: 2500, status: "lost" },
  { marketId: "marathon-record", outcomeId: "no", shares: 12000, averagePrice: 7000, status: "closed", realized: 1180 },
];

export interface MockLeader {
  trader: string;
  profit: number;
  volume: number;
  accuracy: number;
  change: number;
}

export function mockLeaderboard(period: "week" | "month" | "all"): MockLeader[] {
  const random = mulberry32(period === "week" ? 7 : period === "month" ? 30 : 365);
  const scale = period === "week" ? 1 : period === "month" ? 4.2 : 28;
  return mockTraders
    .map((trader) => ({
      trader,
      profit: Math.round((random() * 9000 - 1500) * scale) * 100,
      volume: Math.round(random() * 90000 * scale) * 100,
      accuracy: Math.round(4800 + random() * 3900),
      change: Math.round((random() - 0.5) * 8),
    }))
    .sort((a, b) => b.profit - a.profit);
}

/**
 * Nudges prices every few seconds so demos feel alive. Binary prices stay complementary and
 * multi-outcome prices stay normalized. Paused with `paused` and under reduced motion.
 */
export function useMockMarketFeed(markets: Market[], { paused = false, interval = 3000 }: { paused?: boolean; interval?: number } = {}) {
  const [live, setLive] = useState(markets);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || reduced) return;
    const id = window.setInterval(() => {
      setLive((current) =>
        current.map((market) => {
          if (market.status === "resolved" || Math.random() < 0.4) return market;
          const step = Math.round((Math.random() - 0.5) * 300);
          const outcomes =
            market.type === "binary"
              ? (() => {
                  const yes = Math.max(100, Math.min(9900, market.outcomes[0].price + step));
                  return [
                    { ...market.outcomes[0], price: yes, change24h: (market.outcomes[0].change24h ?? 0) + step },
                    { ...market.outcomes[1], price: FULL - yes, change24h: (market.outcomes[1].change24h ?? 0) - step },
                  ];
                })()
              : (() => {
                  const k = Math.floor(Math.random() * market.outcomes.length);
                  const raw = market.outcomes.map((o, i) => (i === k ? Math.max(50, o.price + step * 2) : o.price));
                  const next = normalize(raw);
                  return market.outcomes.map((o, i) => ({ ...o, price: next[i], change24h: (o.change24h ?? 0) + (next[i] - o.price) }));
                })();
          const last = market.history?.[market.history.length - 1];
          const history = market.history && last ? [...market.history.slice(1), { t: Date.now(), prices: outcomes.map((o) => o.price) }] : market.history;
          return { ...market, outcomes, volume: market.volume + Math.round(Math.random() * 40000), history };
        }),
      );
    }, interval);
    return () => window.clearInterval(id);
  }, [paused, interval]);
  return live;
}
