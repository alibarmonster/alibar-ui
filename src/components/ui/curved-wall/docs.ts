import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CurvedWall } from "@/components/ui/curved-wall/curved-wall";

const items = [
  { src: "/gallery/01.webp", alt: "Blue gradient with soft light", title: "Low Tide", subtitle: "Mara Quell" },
  // ...
];

<div className="h-[30rem]">
  <CurvedWall items={items} curvature={0.6} autoplay="drift" onSelect={(item) => open(item)} />
</div>`,
  a11y: [
    "The canvas is decorative (aria-hidden). A visually hidden list of buttons, one per image, carries the gallery: Tab reaches the centered image, ← → move between images, Home and End jump to the ends, Enter selects.",
    "A polite live region names the centered image after manual moves. It stays quiet while the wall drifts or steps on its own.",
    "Space pauses and resumes stepping. Hovering brakes the drift, and dragging, wheel or keys always take over from autoplay.",
    "With reduced motion there is no drift or autoplay, and every move jumps straight to its panel.",
    "Without WebGL the same images render as a plain, swipeable scroll-snap list.",
  ],
  notes: [
    "Panels are placed on the inside of a cylinder by arc length, so curvature 0 is an exact flat strip and 1 wraps about eight panels around the viewer. viewerDistance changes the field of view, viewAngle tilts the camera.",
    "Every panel, its soft shadow and its floor reflection are drawn in one instanced WebGL2 call over a mipmapped texture array (src/lib/gallery/renderer.ts). Images are cover-cropped to the panel aspect in the shader, so any image size works.",
    "Dragging moves one panel per panel width, so the grabbed point stays under the pointer near the center. Release projects the momentum and snaps to the nearest panel; a quick flick always moves at least one.",
    "The render loop sleeps when nothing moves, pauses offscreen and in hidden tabs, and caps the pixel ratio at dpr (1 on software WebGL). Pass images with crossOrigin-friendly hosting (CORS) if they come from another origin.",
  ],
};
