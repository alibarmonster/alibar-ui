import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BouncyAccordion } from "@/components/ui/bouncy-accordion/bouncy-accordion";

export function Faq() {
  return (
    <BouncyAccordion
      items={[
        { id: "copy", title: "Can I copy components?", content: "Yes, every component is one file." },
        { id: "theme", title: "Will it match my theme?", content: "It reads shadcn's CSS variables." },
      ]}
    />
  );
}`,
  a11y: [
    "Follows the WAI-ARIA accordion pattern: header buttons with aria-expanded and aria-controls, panels with role=region, and Up/Down/Home/End moving between headers.",
    "Closed panels are inert, so their links can't be tabbed to while hidden.",
    "With reduced motion enabled, panels open and close instantly with a short fade.",
  ],
  notes: [
    "Height animates with the grid-rows trick (0fr → 1fr), so content of any height opens without measuring.",
    "The height uses a heavy, barely-underdamped spring; the content settles with a little bounce on top of it.",
    "Only one section is open at a time. Set collapsible={false} to always keep one open.",
  ],
};
