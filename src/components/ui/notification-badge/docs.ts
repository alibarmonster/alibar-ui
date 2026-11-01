import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { NotificationBadge } from "@/components/ui/notification-badge/notification-badge";

export function BellButton({ unread }: { unread: number }) {
  return (
    <NotificationBadge count={unread}>
      <button aria-label={\`Notifications, \${unread} unread\`}>
        <BellIcon />
      </button>
    </NotificationBadge>
  );
}`,
  a11y: [
    "The badge itself is aria-hidden; put the count in the wrapped control's accessible name, as in the examples.",
    "A polite status region announces the new count when it changes (customise the wording with label).",
    "Status is never conveyed by color alone: numbers are shown as text, and dots should be paired with a label such as \"online\".",
    "With reduced motion enabled, the badge fades in and out without sliding, the count cross-fades and the pulse is off.",
  ],
  notes: [
    "The badge slides in diagonally from the corner and pops on a low-damping spring; its width morphs as digits are added.",
    "Counts above max show as \"99+\".",
  ],
};
