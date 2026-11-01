import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BentoGrid, BentoTile } from "@/components/ui/bento-grid/bento-grid";

export function Features() {
  return (
    <BentoGrid>
      <BentoTile className="sm:col-span-2" title="Analytics" description="…" href="/analytics">
        {/* Animate visuals with group-hover: classes */}
        <div className="transition-transform group-hover:scale-105">…</div>
      </BentoTile>
      <BentoTile title="Notifications" description="…" />
    </BentoGrid>
  );
}`,
  a11y: [
    "With href, the title becomes a link stretched over the whole tile: one large target, one tab stop, and a focus ring around the tile.",
    "Keyboard focus lifts the tile and reveals the call to action, the same as hover.",
    "With reduced motion enabled, tiles don't lift; content animations should use motion-reduce: classes too.",
  ],
  notes: [
    "Pure CSS with no JavaScript, so both pieces work as React Server Components.",
    "Each tile is a Tailwind group: style its visual with group-hover: and group-focus-within: to animate it on hover.",
    "The lift's deeper shadow is a separate layer that fades in, so only transform and opacity animate. Spans come from className (sm:col-span-2, row-span-2).",
  ],
};
