import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ParallaxSlider } from "@/components/ui/parallax-slider/parallax-slider";

export function Seasons() {
  return (
    <ParallaxSlider
      slides={[
        {
          id: "dawn",
          label: "Dawn",
          layers: [
            { depth: 0.5, content: <Sky /> },
            { depth: 0.2, content: <FarHills /> },
            { depth: 0.05, content: <NearHills /> },
          ],
          children: <h3>Start before the sun</h3>,
        },
      ]}
    />
  );
}`,
  a11y: [
    "Follows the WAI-ARIA carousel pattern: a labelled region, slides labelled “2 of 3: Noon”, and inactive slides inert and hidden from assistive tech.",
    "Previous/next buttons, a button per slide, and left/right arrow keys; the current slide is announced.",
    "With reduced motion enabled, layers don't parallax and slides change instantly. Dragging still works.",
  ],
  notes: [
    "Each layer's depth sets how much it lags behind the slide (0 moves with it, 1 stays put), so far layers drift slowly and near ones keep pace.",
    "Layers are rendered twice as wide as the slide so their edges never show; keep depth at 0.5 or below.",
    "Drag or swipe between slides; release velocity decides where it snaps.",
  ],
};
