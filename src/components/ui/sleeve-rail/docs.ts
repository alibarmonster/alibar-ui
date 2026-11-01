import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SleeveRail } from "@/components/ui/sleeve-rail/sleeve-rail";

const albums = [
  { src: "/covers/low-tide.webp", alt: "Blue gradient cover", title: "Low Tide", subtitle: "Mara Quell" },
  // ...
];

<div className="h-[34rem]">
  <SleeveRail items={albums} rpm={33.3} onPlayChange={(index, playing) => player.toggle(index, playing)} />
</div>`,
  a11y: [
    "The canvas is decorative (aria-hidden). A visually hidden list of buttons, one per album, carries the rail: Tab reaches the focused album, ← → move, Home and End jump to the ends, Enter plays or stops its record, Escape stops it.",
    "The play button names the album and reports its state with aria-pressed. The arrows are disabled at the ends.",
    "A polite live region names the focused album after each move (quiet while autoplay runs). The ruler is a pointer shortcut and is hidden from assistive tech; every action it offers is also available from the keyboard.",
    "With reduced motion there is no autoplay, moves jump straight to the album, and the record slides out without spinning.",
    "Without WebGL the albums render as a plain, swipeable scroll-snap list.",
  ],
  notes: [
    "Neighbours fan like a hand of cards: each step out tilts by fanAngle, turns by turnAngle and recedes by depth, and sleeves past the first pack tighter by packing, coverflow-style.",
    "The record is three textured discs drawn behind the focused sleeve: generated vinyl grooves, the sleeve's own artwork as the label, and a spindle hole. A light sheen rides on top without spinning. When focus moves on while a record plays, it tucks back into its sleeve before the next one can come out.",
    "accentColor=\"auto\" samples the focused artwork at 24×24, picks its most vivid color and darkens it (or lightens it on dark backgrounds) until it reaches 3:1 contrast. Results are cached per image. Remote images need CORS headers for sampling.",
    "The ruler's ticks slide with the rail through a direct style write in the render loop, so React never re-renders mid-drag. Dragging the ruler scrubs with the same momentum and snapping as dragging the rail; clicking a tick jumps to it.",
  ],
};
