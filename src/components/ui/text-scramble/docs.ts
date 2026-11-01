import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { TextScramble } from "@/components/ui/text-scramble/text-scramble";

export function Hero() {
  return <TextScramble as="h1" text="Decrypting the signal" className="font-mono text-4xl font-semibold" />;
}

// Re-scramble on hover, e.g. inside a nav link
<a href="/work">
  <TextScramble trigger="hover" text="Work" duration={500} />
</a>`,
  a11y: [
    "Screen readers get the final text from a visually hidden copy; the scrambling characters are aria-hidden, so nothing random is ever announced.",
    "With trigger=\"hover\", keyboard focus replays the effect too.",
    "With reduced motion enabled, the text appears as is and changes swap instantly without scrambling.",
  ],
  notes: [
    "An invisible copy of the final text reserves the space, so the scramble never reflows the layout. Monospace fonts scramble most cleanly; proportional fonts work too but glyph widths vary.",
    "The first paint uses a deterministic placeholder, so server and client markup match and there's no hydration warning.",
    "Changing `text` scrambles from whatever is on screen to the new value, so mid-animation changes stay smooth.",
  ],
};
