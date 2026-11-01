import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { WordRotator } from "@/components/ui/word-rotator/word-rotator";

export function Hero() {
  return (
    <h1 className="text-4xl font-semibold">
      Design systems for <WordRotator words={["startups", "agencies", "everyone"]} />
    </h1>
  );
}`,
  a11y: [
    "Screen readers read every word once, from a visually hidden list; the rotating word is aria-hidden, so it isn't announced every few seconds.",
    "Rotation pauses while hovered and while offscreen; pass `paused` to stop it, e.g. from a pause control.",
    "With reduced motion enabled, words crossfade and the width changes instantly.",
  ],
  notes: [
    "Every word is measured from hidden copies (and re-measured when fonts load), and the width springs to the next word, so text after the rotator glides instead of jumping.",
    "Padding and backgrounds on className stay outside the animating box, so pill styles work as-is.",
    "Control it with `index` + `onIndexChange` (combine with `paused` to drive it only from your own buttons).",
  ],
};
