import type { Metadata } from "next";
import { MarketFeedDemo } from "./market-feed-demo";

export const metadata: Metadata = {
  title: "Prediction feed demo",
  description: "A simulated prediction market feed built from Market Card and Trade Ticket, with topic filters, search and a watchlist.",
};

export default function PredictionFeedPage() {
  return <MarketFeedDemo />;
}
