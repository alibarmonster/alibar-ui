import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { GlideTooltip, GlideTooltipProvider } from "@/components/ui/glide-tooltip/glide-tooltip";

export function Toolbar() {
  return (
    <GlideTooltipProvider>
      <GlideTooltip content="Bold">
        <button aria-label="Bold"><BoldIcon /></button>
      </GlideTooltip>
      <GlideTooltip content="Italic">
        <button aria-label="Italic"><ItalicIcon /></button>
      </GlideTooltip>
    </GlideTooltipProvider>
  );
}`,
  a11y: [
    "The surface has role=\"tooltip\", and the active trigger points to it with aria-describedby, so it's read as a description, not a name.",
    "Keyboard focus shows the tooltip immediately; mouse hover waits for the delay; touch never triggers it, since tooltips don't work for touch.",
    "Escape dismisses it, and pressing the trigger hides it so it never covers what you are clicking.",
    "Tooltip content is never interactive. Give icon buttons an aria-label too; the tooltip only supplements it.",
    "With reduced motion enabled, the surface jumps between triggers instead of gliding.",
  ],
  notes: [
    "All tooltips inside one GlideTooltipProvider share a single surface, which glides between triggers. After one closes, the next opens without the delay for a short warm window.",
    "Collision-aware: the surface flips to the other side when there's no room and stays at least 8px inside the viewport, with the arrow tracking the trigger.",
    "A lone GlideTooltip works without a provider.",
  ],
};
