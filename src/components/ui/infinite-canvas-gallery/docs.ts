import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { InfiniteCanvasGallery } from "@/components/ui/infinite-canvas-gallery/infinite-canvas-gallery";

<div className="h-[32rem]">
  <InfiniteCanvasGallery items={photos} depth={0.2} onSelect={(item) => console.log(item.title)} />
</div>`,
  a11y: [
    "The canvas is decorative (aria-hidden). A visually hidden list of buttons opens any image enlarged with its caption; Escape or the close button puts it back.",
    "The arrow buttons pan one cell at a time, and the arrow keys do the same once the canvas has focus (click it first). Inside the image list the arrow keys move between images instead.",
    "With reduced motion there is no drift and keyboard steps jump straight to their cell.",
    "Without WebGL the images render as a plain, swipeable scroll-snap list.",
  ],
  notes: [
    "The grid tiles forever: every column repeats a seeded run of six cards with varied heights, staggered per column, and only the cards in view are generated each frame.",
    "Columns sit at slightly different depths (depth): near ones scale up and pan faster than far ones, which gives the parallax. A throw keeps its momentum and glides to a stop.",
    "wheel is off by default because an endless canvas has no edge to hand scrolling back to the page. Turn it on for full-screen use.",
  ],
};
