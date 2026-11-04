import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CatalogMenu } from "@/components/ui/catalog-menu/catalog-menu";

<CatalogMenu brand={<Logo />} items={[{ label: "Platform", groups, spotlight }]} actions={actions} />`,
  a11y: [
    "Group titles are headings for their columns of links.",
    "The hover highlight is decorative; focus rings stay visible on every link.",
    "Triggers expose `aria-expanded`; Escape closes and returns focus.",
  ],
  notes: [
    "`groups` lays out columns; plain `items` fall back to one list.",
    "`spotlight` adds a striped card along the bottom, good for a launch or event.",
    "One highlight glides between the links you hover (shared layout animation).",
  ],
};
