import type { Metadata } from "next";
import { MarketDetailDemo } from "./market-detail-demo";

export const metadata: Metadata = {
  title: "Prediction market demo",
  description: "A simulated prediction market page composed from the Prediction Markets components: chart, order book or outcome ladder, trade ticket, rules, activity, positions and leaderboard.",
};

export default function PredictionMarketPage() {
  return <MarketDetailDemo />;
}
