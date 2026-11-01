import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { HelixGallery } from "@/components/ui/helix-gallery/helix-gallery";

<div className="h-[32rem]">
  <HelixGallery items={photos} perTurn={8} onSelect={(item) => open(item)} />
</div>`,
  a11y: [
    "The canvas is decorative (aria-hidden). A visually hidden list of buttons carries the gallery: Tab reaches the card facing you, ↑ ↓ travel along the helix, Home and End jump to the ends, Enter selects.",
    "The wheel moves one card per notch and hands scrolling back to the page at either end, so the helix never traps the page.",
    "With reduced motion every move jumps straight to its card; there's no autoplay.",
    "Without WebGL the same images render as a plain, swipeable scroll-snap list.",
  ],
  notes: [
    "Card i sits at angle (i − position) × 2π / perTurn around a vertical axis and rises by rise × card height per card, turned so its face points outward. The card at the current position faces the viewer; cards on the far side darken and the column fades at the top and bottom.",
    "Vertical drags move one card per card rise and settle on a card; touch-action: pan-x keeps horizontal swipes free for the page.",
  ],
};
