import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { GatherNav } from "@/components/ui/gather-nav/gather-nav";

<GatherNav brand={<Wordmark />} items={items} cta={{ label: "Add a tool", href: "/submit" }} onSearch={openSearch} />`,
  a11y: [
    "A labelled `<nav>`; the search control is a real button with an accessible name (`searchLabel`).",
    "The frosted backings and hover highlight are decorative; focus rings stay on every link.",
    "Under reduced motion the bar switches between its two looks without scaling.",
  ],
  notes: [
    "At rest it is a solid white bar with a hairline. Past `gatherAfter` px of scroll the bar fades out, the links gather into a frosted pill, and the search button and narrow-layout menu button get frosted backings of their own.",
    "The frosting uses `backdrop-filter`, so busy content (photos, dithered art) shows through softly blurred.",
    "Pass `scrollContainer` when it lives in a scrolling panel; `gatherAfter={0}` gathers it from the start.",
  ],
};
