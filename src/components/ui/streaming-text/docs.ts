import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { StreamingText } from "@/components/ui/streaming-text/streaming-text";

export function Answer({ text, done }: { text: string; done: boolean }) {
  // Append chunks to \`text\` as they arrive from your model.
  return <StreamingText text={text} streaming={!done} aria-live="polite" />;
}

// Prototyping without a model? Replay a string as a stream:
import { useTextStream } from "@/components/ui/streaming-text/streaming-text";
const { text, streaming, restart } = useTextStream("Hello there…");`,
  a11y: [
    "Sets aria-busy while streaming. Add aria-live=\"polite\" if the answer should be announced; with aria-busy set, screen readers wait for the full answer instead of reading fragments.",
    "The caret is decorative and aria-hidden.",
    "With reduced motion enabled, new tokens fade in without blur.",
  ],
  notes: [
    "Only text appended since the last render animates. If `text` is replaced by something that doesn't start with the old text (regenerate), it starts over.",
    "Tokens that finished animating collapse into one plain text node, so long answers don't keep hundreds of animated spans around.",
    "Whitespace and newlines are preserved (white-space: pre-wrap). For Markdown, stream into your renderer and animate the last block instead.",
  ],
};
