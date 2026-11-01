import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ScatteredPrints } from "@/components/ui/scattered-prints/scattered-prints";

<div className="h-[30rem] bg-[#F3EEE6]">
  <ScatteredPrints items={photos} count={10} onSelect={(item) => console.log(item.title)} />
</div>`,
  a11y: [
    "Every print is a real button named by its title and position. Enter or Space enlarges it in the center (aria-pressed), Escape puts it back, and the arrow keys nudge it across the table.",
    "Focusing or picking up a print brings it to the front, so it is never hidden behind another one while you work with it.",
    "With reduced motion throws stop where you let go and enlarging happens without travel.",
  ],
  notes: [
    "DOM and Motion, no WebGL: each print uses Motion's drag with momentum inside the table, and a throw adds a little spin in the direction it flew.",
    "Double-click a print to bring it forward, upright and enlarged; double-click again, click the table or press Escape to put it back exactly where it was.",
    "The scatter is a seeded loose grid with jitter and tilt, so prints overlap without fully covering each other.",
  ],
};
