import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BannerStack } from "@/components/ui/banner-stack/banner-stack";

export function Announcements({ items }: { items: Banner[] }) {
  return <BannerStack banners={items} onDismiss={(id) => markSeen(id)} />;
}`,
  a11y: [
    "The stack is a labelled region (\"Announcements\"). Only the front card is interactive; cards behind are inert and aria-hidden.",
    "Each card has a labelled dismiss button, and a polite live region announces how many announcements remain.",
    "Tone is shown with an icon as well as a color, and the text stays in the foreground color for contrast.",
    "With reduced motion enabled, cards fade in place instead of stacking, lifting and springing forward.",
  ],
  notes: [
    "Cards behind the front one take its height, so only their edges peek out like a deck; dismissing springs the next card forward.",
    "The stack hides dismissed banners itself and reports them through onDismiss so you can persist them.",
  ],
};
