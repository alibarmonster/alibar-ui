import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ShelfGallery } from "@/components/ui/shelf-gallery/shelf-gallery";

<ShelfGallery
  items={[{ id: "1", image: "/covers/one.jpg", alt: "Blue cover with stars", title: "Exponents", subtitle: "Summer edition" }]}
  emptyShelves={1}
  onSelect={(item) => track("open", item.id)}
/>`,
  a11y: [
    "The wall is a labelled section of lists; every cover is a button named \"Open …\" with its own alt text, so the shelves read as a list of items.",
    "The open view is a modal dialog: focus moves to its close button, Escape or a click on the backdrop closes it, and focus returns to the cover that opened it.",
    "Under reduced motion covers fade in instead of dropping onto the shelf, don't tilt, and the open view appears without the flight.",
  ],
  notes: [
    "Covers lift and tilt toward a mouse or pen (not touch) on springs with a soft-light glare, and keyboard focus lifts them too.",
    "Sizes follow the gallery's width through container queries, so the shelves work in a narrow card as well as full width.",
    "Pass `emptyShelves` for spare boards below the collection, and `renderDetail` to add a description or actions to the open view.",
  ],
};
