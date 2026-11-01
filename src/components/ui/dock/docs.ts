import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Dock } from "@/components/ui/dock/dock";

export function AppDock() {
  return (
    <Dock
      items={[
        { id: "files", label: "Files", icon: <FolderIcon />, href: "/files" },
        { id: "mail", label: "Mail", icon: <MailIcon />, onClick: openMail, active: true },
      ]}
    />
  );
}`,
  a11y: [
    "The dock is a toolbar with one tab stop; arrow keys, Home and End move between items, and each item is a labelled button or link.",
    "Keyboard focus magnifies the focused icon and shows its tooltip, just as hovering does.",
    "Magnification only follows a mouse; touch and pen users get a regular row of buttons.",
    "With reduced motion enabled, icons stay their resting size and the launch bounce is off; tooltips still appear.",
  ],
  notes: [
    "Magnification is transform-only: icons scale from the bottom, and neighbours get computed x offsets so they spread apart without animating width.",
    "The background widens by animating clip-path on a wider layer, so its rounded corners never stretch.",
    "Give the dock room above it; magnified icons and tooltips extend upward.",
  ],
};
