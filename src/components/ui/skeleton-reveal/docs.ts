import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Skeleton, SkeletonReveal } from "@/components/ui/skeleton-reveal/skeleton-reveal";

export function Profile({ user }: { user?: User }) {
  return (
    <SkeletonReveal
      loading={!user}
      skeleton={<div className="flex gap-4"><Skeleton className="size-12 rounded-full" /><Skeleton className="h-4 w-40" /></div>}
    >
      {user ? <ProfileCard user={user} /> : null}
    </SkeletonReveal>
  );
}`,
  a11y: [
    "The container sets aria-busy while loading, and a status message (“Loading”) is announced; the skeleton itself is aria-hidden.",
    "With reduced motion enabled, skeletons stop pulsing and content fades in without blur.",
  ],
  notes: [
    "The skeleton and the content share one grid cell, so they cross-fade in place. Shape the skeleton like the content and nothing jumps.",
    "Skeleton is a plain pulsing block: size and round it with className (h-4 w-40, size-12 rounded-full).",
  ],
};
