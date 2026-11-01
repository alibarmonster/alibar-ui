import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LetterCascade } from "@/components/ui/letter-cascade/letter-cascade";

export function FollowButton({ following }: { following: boolean }) {
  return (
    <button aria-pressed={following}>
      <LetterCascade text={following ? "Following" : "Follow"} animateOnMount={false} />
    </button>
  );
}`,
  a11y: [
    "Screen readers get the current text from a visually hidden copy; the falling letters are aria-hidden.",
    "Announce changes the way you normally would, e.g. aria-pressed on a toggle, or an aria-live region for status text.",
    "With reduced motion enabled, letters crossfade without falling or tilting.",
  ],
  notes: [
    "Only positions whose letter changed animate, in order, so \"Follow\" → \"Following\" keeps \"Follow\" still and drops in \"ing\".",
    "Letters shift with layout animation when neighbours change width. Meant for a single line of short text.",
  ],
};
