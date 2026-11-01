import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SlidingTabs } from "@/components/ui/sliding-tabs/sliding-tabs";

export function ProjectTabs() {
  return (
    <SlidingTabs
      aria-label="Project"
      variant="underline"
      items={[
        { value: "overview", label: "Overview", content: <Overview /> },
        { value: "activity", label: "Activity", content: <Activity /> },
      ]}
    />
  );
}`,
  a11y: [
    "Built on Radix Tabs: role=\"tablist\", \"tab\" and \"tabpanel\" with aria-selected and aria-controls wired up.",
    "Arrow keys move between tabs, Home and End jump to the ends, and disabled tabs are skipped.",
    "A mouse click selects without moving focus, so a keyboard focus ring never appears on click.",
    "With reduced motion enabled, the indicator jumps and panels cross-fade without sliding.",
  ],
  notes: [
    "pill fills the active tab, underline draws a bar on the baseline, and segment raises a white pill on a muted track.",
    "Panels slide from the side of the newly chosen tab. Leave out content to render only the tab bar and drive your own panels with onValueChange.",
  ],
};
