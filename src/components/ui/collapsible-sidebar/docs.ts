import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import Link from "next/link";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar/collapsible-sidebar";

export function AppSidebar({ active }: { active: string }) {
  return (
    <CollapsibleSidebar
      linkComponent={Link}
      activeId={active}
      sections={[
        { items: [{ id: "home", label: "Home", icon: <HomeIcon />, href: "/" }] },
        { title: "Workspace", items: [{ id: "settings", label: "Settings", icon: <GearIcon />, href: "/settings" }] },
      ]}
    />
  );
}`,
  a11y: [
    "Items live in a labelled <nav>; the current one has aria-current=\"page\".",
    "The toggle is a button with aria-expanded and aria-controls, labelled \"Collapse sidebar\" or \"Expand sidebar\".",
    "When collapsed, items keep their label as aria-label, and a tooltip shows it on hover and keyboard focus.",
    "With reduced motion enabled, the width changes instantly and labels fade in place.",
  ],
  notes: [
    "The width change is a Motion layout animation: icons hold position, and labels leave before the sidebar narrows and fade back after it widens.",
    "Give neighbouring content layout too (as in the demo) so it glides along instead of jumping.",
    "Collapsed tooltips render in a portal, because the scrolling nav can't let them overflow.",
  ],
};
