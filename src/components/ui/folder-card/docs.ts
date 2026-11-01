import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { FolderCard } from "@/components/ui/folder-card/folder-card";

export function Files() {
  return <FolderCard title="Design reviews" meta="24 files" href="/files/design-reviews" />;
}`,
  a11y: [
    "A link when href is set, a button otherwise. The folder artwork is aria-hidden; the title and meta are the accessible name.",
    "Opens on hover and on keyboard focus (focus-visible), so keyboard users get the same preview.",
    "With reduced motion enabled, pages rise slightly without fanning and the front panel doesn't tip.",
  ],
  notes: [
    "The front panel tips forward in 3D around its bottom edge while up to three pages rise and fan out, all with transforms.",
    "Pass previews as `items` (images, documents), or leave it empty for blank pages. `color` tints the folder.",
    "`open` holds it open, e.g. to show a drop target while dragging files over it.",
  ],
};
