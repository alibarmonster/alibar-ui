import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AsciiSharkSea } from "@/components/ui/ascii-shark-sea/ascii-shark-sea";

<AsciiSharkSea
  sharks={[{ kind: "hammerhead" }, { kind: "great-white", size: 0.84 }, { kind: "reef", size: 0.72 }]}
  palette="dark"
  className="h-[560px]"
>
  <Hero />
</AsciiSharkSea>`,
  a11y: [
    "The sea is a decorative canvas (aria-hidden) behind your content, which keeps its own semantics and tab order.",
    "Clicks on links, buttons and form fields belong to them and never drop bait. Fish dodging the cursor and bait are extras; nothing depends on them.",
    "Under reduced motion the sea settles for a few simulated seconds and then holds one still frame; clicks don't drop bait. It pauses offscreen, in hidden tabs and while `paused` is set.",
  ],
  notes: [
    "Seen from above. Each shark is a 20-node follow-the-leader spine with a bend limit per joint, a travelling body wave and pectoral fins that bank into turns. Every frame the cells around it are supersampled against a top-down outline (snout, falcate pectorals, pelvics, forked tail, a hammer-shaped head for hammerheads, a whip tail for threshers): fully covered cells become a shaded block lit from the top left with a glyph that gets denser in shadow, partly covered cells become light edge glyphs, so silhouettes stay soft. Glyphs are keyed to body coordinates so they ride along with the skin, and now and then one catches a color.",
    "Fish are one dash per cell. Schools flock (separation in cell units, alignment, cohesion, a blind spot behind each fish), pass alarm from fish to fish, break to either side of a passing shark and regroup; one kind mills into a bait ball, one swims in ribbons, one swarms. Hungry sharks hunt, preferring stragglers in sparse water; eaten fish return later as a new school from an edge. A click drops bait that calm fish crowd and a hungry shark comes for.",
    "Anything that swims leaves energy in a wake field that blurs and fades each step, lighting dots in the water; sharks also cast a faint shadow. Content passed as children keeps the middle clear: sharks steer around an ellipse there.",
    "Learned from ascii-sharks by drewdi (github.com/stackedlol/ascii-sharks, MIT); this is an independent implementation and the file carries its license notice.",
  ],
};
