import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PriceTicker } from "@/components/ui/price-ticker/price-ticker";

<PriceTicker
  items={[{ label: "ETH/USD", token: { symbol: "ETH" }, price: ethPrice, change24h: 0.021 }]}
  speed={40}
/>`,
  a11y: [
    "A labelled region; only the first copy of the pairs is exposed to screen readers, and the loop copy is aria-hidden and inert.",
    "Hovering or focusing the ticker eases it to a stop so prices can be read.",
    "Changes carry an arrow and a sign, not just color, and prices are read as plain text instead of rolling reels.",
    "With reduced motion the ticker doesn't move: it becomes a horizontally scrollable row and price updates are color-only.",
  ],
  notes: [
    "Prices are bigint values with 8 decimals, formatted before display. Each tick rolls the changed digits and flashes green or red.",
    "The loop length is measured with a ResizeObserver, so it stays seamless when fonts load or items change.",
  ],
};
