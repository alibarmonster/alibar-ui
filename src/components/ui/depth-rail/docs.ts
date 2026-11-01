import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DepthRail } from "@/components/ui/depth-rail/depth-rail";

const places = [
  { id: "lisbon", title: "Lisbon", subtitle: "Portugal", meta: "Spring", image: "/places/lisbon.jpg" },
  // 6–12 items work best
];

<DepthRail items={places} label="Places" onIndexChange={(i) => console.log(places[i].title)} />`,
  a11y: [
    "The root is a labelled carousel (aria-roledescription=\"carousel\") that takes focus: ← → move one card, Home and End jump to the ends. Each card is a slide labelled like \"2 of 8: Lisbon\"; cards other than the front one are aria-hidden.",
    "A polite live region announces the front card after every move. The position ticks are pointer shortcuts and stay out of the tab order.",
    "With reduced motion the rail jumps straight to each card, cards don't turn or drift, and only short fades remain.",
    "Vertical swipes still scroll the page (touch-action: pan-y); only horizontal drags move the rail.",
  ],
  notes: [
    "No WebGL: cards are DOM elements with CSS 3D transforms. One Motion value holds the rail position; every card's offset, turn, depth, scale, shade, z-index, visibility and image drift is a useTransform of it, so React never re-renders during a drag or a spring.",
    "A release projects the momentum (velocity × 0.22 s), lands on that card and springs there starting at the release speed. A quick flick always moves at least one card, and the rail rubber-bands past either end. Horizontal trackpad scrolling moves it directly and settles with the same spring.",
    "Cards size with the container through container query units, clamp(168px, 38cqw, 272px). Cards more than 3.6 positions from the front get visibility: hidden.",
    "The reflection is a flipped copy of the image under a gradient mask; the shadow is a static blurred ellipse, so neither costs anything per frame.",
  ],
};
