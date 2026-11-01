import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Typewriter } from "@/components/ui/typewriter/typewriter";

export function Hero() {
  return (
    <h1 className="text-4xl font-semibold">
      Interfaces that feel <Typewriter phrases={["alive", "effortless", "inevitable"]} />
    </h1>
  );
}`,
  a11y: [
    "Screen readers read every phrase once, from a visually hidden copy; the half-typed text and caret are aria-hidden, so nothing is announced keystroke by keystroke.",
    "Typing pauses while the text is offscreen, and `paused` stops it entirely if you need a pause control for long-running loops.",
    "With reduced motion enabled, whole phrases crossfade instead of being typed and the caret stops blinking.",
  ],
  notes: [
    "Keystrokes vary by ±40% and pause briefly after punctuation, so typing reads as human rather than mechanical.",
    "Use `reserveSpace` when the typewriter sits mid-sentence: the line keeps the width of the longest phrase and the words after it never shift.",
  ],
};
