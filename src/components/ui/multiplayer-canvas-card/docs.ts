import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MultiplayerCanvasCard } from "@/components/ui/multiplayer-canvas-card/multiplayer-canvas-card";

<MultiplayerCanvasCard
  title="Build it together, live"
  description="Cursors, selections and comments sync in real time."
  collaborators={[
    { name: "Maya", color: "#3b82f6" },
    { name: "Jonas", color: "#f97316" },
    { name: "Lena", color: "#22c55e" },
  ]}
/>`,
  a11y: [
    "The scene is one image (role=\"img\") with a text summary of who is doing what; its scripted cursors and shapes are hidden from screen readers. The title and description are real headings and text.",
    "Under reduced motion the scene holds a single moment (selection drawn, note typed, comment open) and nothing moves; it also pauses offscreen and in hidden tabs.",
  ],
  notes: [
    "One loop moves everything through refs: each cursor follows scripted cubic Bézier paths (in % of the canvas), the first drags a selection box that highlights the shapes, the second types into a note, the third opens a comment thread, and dashed lines flow from every cursor to the avatar stack.",
    "Hovering speeds the scene up slightly and shows the visitor's own cursor labelled “You”. The background is `FlowLines` from Flow Line Chat Card, which Multiplayer Canvas Card imports as a sibling component.",
    "Up to three collaborators are shown; pair it with Flow Line Chat Card for a two-card feature section.",
  ],
};
