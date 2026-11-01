import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PriceChart } from "@/components/ui/price-chart/price-chart";

const [timeframe, setTimeframe] = useState("1D");

<PriceChart
  pair="ETH/USD"
  data={candles[timeframe]} // { time, open, high, low, close, volume? }[]
  timeframe={timeframe}
  onTimeframeChange={setTimeframe}
/>`,
  a11y: [
    "The chart is a focusable group: arrow keys move a crosshair candle by candle (Home and End jump), and each candle's OHLC is announced through a live region.",
    "A visually hidden table carries every candle, so the data is available without the chart.",
    "Timeframes are a labelled radio group with a sliding indicator; the header change shows an arrow and a sign as well as color.",
    "New data reveals left to right with a clip-path. Reduced motion uses a plain fade and moves the indicator instantly.",
  ],
  notes: [
    "Prices here are display numbers for chart geometry (not balances), so plain numbers are fine. Pass formatPrice to match your quote currency.",
    "Time labels use a fixed time zone (UTC by default) so server and client render the same axis.",
  ],
};
