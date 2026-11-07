import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PaneStackPortfolio } from "@/components/ui/pane-stack-portfolio/pane-stack-portfolio";

<PaneStackPortfolio
  owner={{ name: "Alibar", role: "Motion & 3D designer", timeZone: "Asia/Jakarta" }}
  projects={[
    { id: "coral-bloom", title: "Coral Bloom", category: "3D", client: "Lumivo", year: 2026, tools: ["Sculpting"], media: { type: "image", src: "/work/coral.webp" } },
    { id: "tidal-type", title: "Tidal Type", category: "Motion", media: { type: "video", src: "/work/tidal.mp4", poster: "/work/tidal.webp", duration: "0:42" } },
  ]}
  onSelect={(project) => track("open", project.id)}
/>`,
  a11y: [
    "The stack is a carousel region: only the front pane is in the tab order (Enter opens it), arrow keys and Home/End move through the stack, and a polite live region announces the new front project. The scrubber is a slider with arrow keys.",
    "Filter chips and the Overview/Index toggle are pressed-state buttons. The detail view is a modal dialog titled by the project, with Escape and a Close button; focus returns to the front pane.",
    "Under reduced motion every move, re-stack and morph is instant, the panes stop turning on Y and the live dot stops pulsing.",
  ],
  notes: [
    "All panes read one Motion value, the stack position. Each pane maps its distance from it to x, y, scale, Y rotation, opacity and z-index, so wheel, drag (with momentum), keys, the scrubber and clicks on back panes all just animate that value with a spring. Filtering springs each pane's own slot to its new index while the others fade out.",
    "The front pane's media, the Index tiles and the detail player share a layoutId, so opening morphs the pane into the player and the Overview/Index switch moves tiles in and out of the stack.",
    "A video without a playable `src` shows its poster and plays a simulated progress line for its `duration`. Below 560px wide the stack turns into a vertical swipe deck and the detail view opens as a full sheet.",
    "The built-in header shows the owner, Studio and Contact links, a booking status with a live dot, the local time in `owner.timeZone` (rendered after hydration) and a Dark toggle that switches the component's own colors. Pass `header` to replace it.",
  ],
};
