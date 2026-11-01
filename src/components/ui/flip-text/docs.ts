import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import Link from "next/link";
import { FlipText } from "@/components/ui/flip-text/flip-text";

export function NavLink() {
  return (
    <Link href="/work" className="group">
      <FlipText>Work</FlipText>
    </Link>
  );
}`,
  a11y: [
    "Pure CSS with no JavaScript: it flips on hover of the text itself, or of the closest ancestor with Tailwind's group class, and on keyboard focus (focus-visible) of either.",
    "Screen readers get the word once, from a visually hidden copy; the letter halves are aria-hidden.",
    "With reduced motion enabled, the transition is removed: the text simply stays put.",
  ],
  notes: [
    "Works as a React Server Component; there is no state or effect.",
    "Hover styles only apply on devices with a real hover, so touch taps don't leave the text stuck mid-flip.",
    "`active` holds the flipped state, e.g. for a selected tab, and `flippedClassName` styles the incoming letters (a color change, for example).",
  ],
};
