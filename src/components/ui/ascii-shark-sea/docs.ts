import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AsciiSharkSea } from "@/components/ui/ascii-shark-sea/ascii-shark-sea";

<AsciiSharkSea
  sharks={[{ kind: "hammerhead" }, { kind: "great-white", size: 1.2 }, { kind: "reef" }]}
  schools={3}
  className="h-[520px]"
>
  <Hero />
</AsciiSharkSea>`,
  a11y: [
    "The sea is a decorative canvas (aria-hidden) behind your content, which keeps its own semantics and tab order.",
    "Clicks on links, buttons and form fields belong to them and never drop bait. Nothing depends on the pointer: fish avoiding the cursor and bait are extras.",
    "Under reduced motion it draws one still frame and clicks don't drop bait. It pauses offscreen, in hidden tabs and while `paused` is set.",
  ],
  notes: [
    "Each shark is a 14-segment follow-the-leader spine with a vertical sway that grows toward the tail. Every frame, the cells around it are rasterized against a side profile (pointed snout, dorsal and pectoral fins, a two-lobed tail) and stamped with glyphs from a shared atlas: dense glyphs along the back, lighter ones on the flanks, dots on the pale belly, gill slits and an eye. Hammerheads get a T-shaped head, reef sharks black fin tips, great whites a heavier body and a fuller tail.",
    "Sharks patrol across the view and turn once they are fully past an edge, often at a new depth: farther sharks are shorter and fainter. Fish schools are boids (separation, alignment, cohesion) that drift around a wandering home, scatter from any shark's head, middle or tail and regroup after it passes.",
    "A click drops bait (`*`) that sinks slowly. Nearby fish crowd it, and after a moment the nearest shark heading that way comes for it, then leaves a burst of bubbles.",
    "`palette` takes `light`, `dark` or an object of colors that starts from `base`; the water is a CSS gradient from `surface` to `deep`, so it shows before the canvas draws.",
  ],
};
