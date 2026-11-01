import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LikeButton } from "@/components/ui/like-button/like-button";

export function PostActions({ likes, likedByMe }: { likes: number; likedByMe: boolean }) {
  return <LikeButton count={likes} defaultLiked={likedByMe} onLikedChange={(liked) => saveLike(liked)} />;
}`,
  a11y: [
    "A toggle button with aria-pressed and a stable accessible name (\"Like\" by default).",
    "The counter is linked with aria-describedby, so screen readers hear the count without it changing the button's name.",
    "Particles, the ring and the heart pop are decorative and aria-hidden.",
    "With reduced motion enabled, there is no burst or pop, and the counter cross-fades instead of rolling.",
  ],
  notes: [
    "`count` should exclude the current viewer. The button adds one while liked, so optimistic updates are free.",
    "The heart uses the --destructive color. Override it with a text color utility on the button if you prefer another hue.",
  ],
};
