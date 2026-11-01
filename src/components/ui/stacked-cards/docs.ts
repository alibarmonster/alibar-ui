import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { StackedCards } from "@/components/ui/stacked-cards/stacked-cards";

export function Trips() {
  return (
    <StackedCards
      aria-label="Trips"
      items={[
        { id: "kyoto", label: "Kyoto", content: <Postcard place="Kyoto" /> },
        { id: "lisbon", label: "Lisbon", content: <Postcard place="Lisbon" /> },
      ]}
    />
  );
}`,
  a11y: [
    "A list of cards. Keyboard focus anywhere in the stack fans it out, just like hover.",
    "Each card behind the top one has a “Bring … to the front” button, so reordering doesn't depend on a pointer.",
    "With reduced motion enabled, the stack stays put; bringing a card forward still works.",
  ],
  notes: [
    "Cards share one grid cell, so the stack takes the size of the largest card without absolute positioning.",
    "Only transforms animate: offset, scale and rotation around the bottom edge. Cards beyond `depth` stay hidden behind.",
  ],
};
