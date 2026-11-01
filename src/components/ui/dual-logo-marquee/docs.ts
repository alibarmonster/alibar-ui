import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DualLogoMarquee } from "@/components/ui/dual-logo-marquee/dual-logo-marquee";

<DualLogoMarquee
  eyebrow="Powering product teams everywhere"
  items={[{ name: "Acme", logo: <AcmeLogo />, href: "/customers/acme" }]}
/>`,
  a11y: [
    "Each logo is named once (a link with hidden text, or role=\"img\" with a label); the duplicate copies that make the loop seamless are aria-hidden and inert.",
    "Hovering or focusing anywhere in the section eases both rows to a stop, so links can be read and clicked.",
    "With reduced motion nothing scrolls: the logos wrap into a static, centered cloud.",
  ],
  notes: [
    "Each row loops one copy's measured width, so it stays seamless as fonts load or the container resizes. The second row runs a little slower for depth.",
  ],
};
