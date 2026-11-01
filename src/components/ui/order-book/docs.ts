import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { OrderBook } from "@/components/ui/order-book/order-book";

<OrderBook
  bids={[{ price: 6300, shares: 120000 }]} // basis points, hundredths of a share
  asks={[{ price: 6500, shares: 98000 }]}
  onPriceSelect={(price) => setLimitPrice(price)}
/>`,
  a11y: [
    "Asks and bids are lists; each price row is a button whose label names the side, price, size and running total.",
    "The Yes/No book switch is a radio group. The spread row states the spread in text.",
    "Size changes flash briefly, but the new number is always in the text; the flash is skipped with reduced motion.",
  ],
  notes: [
    "The No book mirrors Yes: a Yes bid at p is a No ask at 100 − p, so one set of levels drives both views.",
    "Depth bars are cumulative totals drawn with scaleX on a fixed track (transform only).",
    "Data is simulated. Sizes are hundredths of a share and totals are in cents.",
  ],
};
