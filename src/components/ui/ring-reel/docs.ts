import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { RingReel } from "@/components/ui/ring-reel/ring-reel";

<div className="h-[32rem]">
  <RingReel items={prints} onViewChange={(view) => console.log(view)}>
    <h2 className="text-2xl font-semibold">Sixteen prints on one turning wheel</h2>
  </RingReel>
</div>`,
  a11y: [
    "The canvas is decorative (aria-hidden). A visually hidden list of buttons, one per card, carries the reel: Tab reaches the card at the top, ← → turn the wheel, Enter zooms into the arc (or selects there), Escape zooms back out.",
    "The arc view's caption and controls are inert while the ring is showing, and the centered content is inert in arc view, so hidden controls never take focus.",
    "A polite live region names the card at the top after manual moves, and stays quiet while the wheel spins or autoplay steps.",
    "With reduced motion the wheel stands still, the zoom and every step jump straight to the end, and the flip wave is off.",
    "Without WebGL the cards render as a plain, swipeable scroll-snap list.",
  ],
  notes: [
    "The wheel's radius and card size are solved together so the ring plus its cards fits the stage; count sets how many cards share the wheel (items repeat if needed).",
    "Arc view is a camera move, not a new layout: the camera zooms into the top of the same wheel until arcSize of it spans the width, and apex sets where the top card lands. The zoom runs on a critically damped spring.",
    "The flip wave turns each card around its own axis (also when it leans along the wheel), starting at the top and running outward, and shows accentColor on the back. It plays on every view change and every 8–13 seconds while the ring turns.",
    "In ring view a drag follows the pointer's angle around the wheel's center; in arc view it moves sideways. Both snap to a card. Vertical swipes still scroll the page on touch screens.",
  ],
};
