import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CrumpleNotes } from "@/components/ui/crumple-notes/crumple-notes";

<CrumpleNotes
  notes={[
    { id: "a", title: "Launch day", body: "Check the onboarding copy one more time.", date: "Mon, 9 Nov" },
    { id: "b", title: "Salt flats", body: "First light, no wind.", image: "/photos/salt-flats.webp" },
  ]}
  onActiveChange={(id) => console.log(id)}
/>`,
  a11y: [
    "The flat note is a real article (title, text and date as DOM text), and each paper ball is a button named “Unfold note: …”. A polite live region announces the note that unfolds.",
    "Throwing the note is a pointer extra; the ball buttons do the same with a click or the keyboard.",
    "Under reduced motion, or without WebGL2 (including software renderers), there is no crumpling: the note crossfades and the balls are drawn with CSS.",
  ],
  notes: [
    "Each sheet is a 48×48 grid (`createGrid` from the HTML-in-Canvas GL helpers) textured with the note drawn on a 2D canvas. The vertex shader blends it from flat, through ridges along a few random fold lines, to a lumpy sphere, with the edges giving way first. Normals come from screen-space derivatives, so every fold catches the light, and a note that has been crumpled keeps faint crease lines when it is opened again.",
    "Clicking a ball unfolds it into the middle while the current note crumples and rolls into the freed spot. Dragging the flat note follows the pointer; a quick throw (or a long drag) crumples it and brings up the next note.",
    "While nothing moves, the flat note on screen is DOM laid out exactly like its texture, so text stays crisp and selectable. Handwriting uses `--font-hand` (Caveat on this site) with a cursive fallback.",
  ],
};
