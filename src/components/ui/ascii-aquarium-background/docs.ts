import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { useRef, useState } from "react";
import { AsciiAquariumBackground, type AquariumMode } from "@/components/ui/ascii-aquarium-background/ascii-aquarium-background";

const input = useRef<HTMLFormElement>(null);
const [mode, setMode] = useState<AquariumMode>("idle");

<AsciiAquariumBackground focusRef={input} mode={mode} className="grid min-h-svh place-items-center">
  <form ref={input} onFocus={() => setMode("listening")} onSubmit={() => setMode("thinking")}>
    <input placeholder="Ask anything…" />
  </form>
</AsciiAquariumBackground>

// Or switch modes without re-rendering:
// const aquarium = useRef<AsciiAquariumHandle>(null);
// <AsciiAquariumBackground ref={aquarium} />
// aquarium.current?.setMode("thinking");`,
  a11y: [
    "The canvas is aria-hidden decoration. Your content stays as real DOM on top of it, so headings, inputs and buttons work as usual.",
    "Click ripples are pointer-only decoration. Clicks on links, buttons, form fields and anything inside focusRef never ripple. Add data-aquarium-ignore to opt out other elements.",
    "With reduced motion, creatures drift at about a third of their speed, specks twinkle slowly and ripples and bursts are turned off.",
    "Glyphs are faint but busy. Put text that overlaps the creatures on a solid or blurred surface so it stays readable.",
  ],
  notes: [
    "Creatures are painted as soft shapes onto a tiny offscreen canvas where one pixel is one cell. Each frame reads it back with getImageData and stamps one glyph per cell: cells under 8% alpha are skipped, faint edges get a dot, and the rest get a tinted square plus a glyph from a dark, mid or light ramp chosen by shading.",
    "Every glyph is drawn once into a sprite atlas (in your mono font, Geist Mono by default) for each tint, then copied with drawImage. Nothing calls fillText per frame. The atlas is rebuilt when the cell size, pixel ratio, palette or font changes.",
    "The hero is painted with its blue channel at full strength, so each cell's tint blends from ink to accent wherever the hero overlaps other creatures.",
    "Cell size lives in the --cell CSS variable (9, 11 or 12px by viewport width, or the cell prop). The grid paper uses it as its background-size and the canvas reads the same value, so glyphs sit exactly inside the squares.",
    "2D canvas only, no WebGL. The pixel ratio is capped at 2, frames are capped near 60fps, and the loop stops offscreen, in hidden tabs and while paused. Cost grows with the cell count: a 1440×900 hero at 12px is about 9,000 cells.",
  ],
};
