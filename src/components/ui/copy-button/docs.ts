import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CopyButton } from "@/components/ui/copy-button/copy-button";

export function InviteLink() {
  return <CopyButton value="https://example.com/invite" label="Copy link" />;
}`,
  a11y: [
    "Renders a native button, so it is reachable with Tab and activates with Enter or Space.",
    "Icon-only buttons get an accessible name of \"Copy to clipboard\" unless you pass aria-label.",
    "A polite status region announces \"Copied to clipboard\" after each successful copy.",
    "Both labels share one grid cell, so the button never changes size or shifts nearby content.",
    "With reduced motion enabled, the icon and label swap with a plain cross-fade.",
  ],
  notes: [
    "Falls back to document.execCommand(\"copy\") where the async Clipboard API is unavailable, such as plain-HTTP origins.",
  ],
};
