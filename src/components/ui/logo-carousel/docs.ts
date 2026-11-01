import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LogoCarousel } from "@/components/ui/logo-carousel/logo-carousel";

export function Customers() {
  return (
    <LogoCarousel
      slots={4}
      logos={[
        { id: "northwind", name: "Northwind", logo: <NorthwindLogo /> },
        // …more logos than slots
      ]}
    />
  );
}`,
  a11y: [
    "Screen readers hear every company name once, from a visually hidden sentence; the rotating artwork is aria-hidden.",
    "Rotation pauses on hover and while offscreen; pass `paused` to stop it entirely.",
    "With reduced motion enabled, logos crossfade without blur or movement.",
  ],
  notes: [
    "Each swap replaces every slot with the next logos in turn, staggered left to right, so no logo is ever shown twice at once.",
    "Columns come from a --slots variable, so classes like max-sm:grid-cols-2 can rearrange the slots on small screens.",
  ],
};
