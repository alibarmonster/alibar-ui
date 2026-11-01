import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Home, Search } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs/expandable-tabs";

export function AppTabs() {
  return (
    <ExpandableTabs
      aria-label="Sections"
      items={[
        { value: "home", label: "Home", icon: <Home />, content: <HomePanel /> },
        { value: "search", label: "Search", icon: <Search />, content: <SearchPanel /> },
      ]}
    />
  );
}`,
  a11y: [
    "A real tablist: each tab has role=\"tab\", aria-selected and a roving tabindex; the panel has role=\"tabpanel\" and is labelled by its tab.",
    "Arrow keys move and activate tabs, and Home and End jump to the ends.",
    "Every tab keeps its label as the accessible name (aria-label), even while only its icon is visible.",
    "With reduced motion enabled, tabs and the panel resize instantly and the content cross-fades.",
  ],
  notes: [
    "Width and height changes are Motion layout animations (transforms with distortion correction), never width or height.",
    "Leave out content for a compact toolbar or nav bar; use onValueChange to react to the selection.",
  ],
};
