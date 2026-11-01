import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { IconCloud } from "@/components/ui/icon-cloud/icon-cloud";

<IconCloud icons={[{ name: "React", icon: <ReactIcon /> }, { name: "Figma", icon: <FigmaIcon /> }]} />`,
  a11y: [
    "The cloud is a labelled group with a visually hidden list of every icon's name; the moving tiles are aria-hidden.",
    "Dragging is optional, and nothing depends on the sphere's orientation.",
    "With reduced motion the sphere holds its resting pose (dragging still works).",
  ],
  notes: [
    "Icons sit on a Fibonacci sphere. Each frame writes transforms straight to the elements, so React never re-renders while it spins. Depth drives scale, opacity and stacking.",
    "The server and the first paint use the same resting pose, so hydration matches. It pauses offscreen and in hidden tabs.",
  ],
};
