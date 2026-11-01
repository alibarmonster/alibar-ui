import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LogoGrid } from "@/components/ui/logo-grid/logo-grid";

<LogoGrid
  eyebrow="Trusted by fast-growing startups"
  items={[{ name: "Acme", logo: <AcmeLogo />, href: "/customers/acme" }]}
  columns={4}
  variant="grid" // "grid" | "plain" | "fill"
/>`,
  a11y: [
    "Each cell is one link announced as \"Learn more about {name}\"; the logo and the revealed label are decorative.",
    "Keyboard focus (focus-visible) plays the same lift-and-reveal as hover, with a ring inside the cell.",
    "On touch screens (hover: none) the label is always visible, since there's no hover to reveal it.",
    "With reduced motion the logo stays put and the label only fades in, with no slide, blur or arrow nudge.",
  ],
  notes: [
    "Hover and focus are pure CSS transitions on transform, opacity and filter, so only the hovered cell does any work. The fill variant adds a shared-layout highlight with Motion.",
    "Hairlines come from a 1px grid gap over the border color, with filler cells completing the last row at each breakpoint. Columns switch at a 34rem container width, not the viewport.",
    "Pass logos that use currentColor (or monochrome SVGs and images); the cell sets them about 28px tall.",
  ],
};
