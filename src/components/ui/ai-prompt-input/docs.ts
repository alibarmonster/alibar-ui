import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { AIPromptInput } from "@/components/ui/ai-prompt-input/ai-prompt-input";

export function Composer() {
  const { send, stop, isStreaming } = useChat();
  return (
    <AIPromptInput
      loading={isStreaming}
      onStop={stop}
      onSubmit={(text, attachments) => send(text, attachments.map((a) => a.file))}
    />
  );
}`,
  a11y: [
    "A labelled textarea: Enter sends, Shift+Enter adds a line, and nothing sends while an input method (IME) is composing.",
    "Attachments are a list whose chips have “Remove …” buttons; the send button becomes “Stop generating” while loading.",
    "With reduced motion enabled, the border lights up without orbiting and chips appear without blur.",
  ],
  notes: [
    "The textarea grows with its content up to maxRows, then scrolls.",
    "Files come from the paperclip button or a drag-and-drop onto the field. Each attachment keeps its File so you can upload it.",
    "The orbiting border is a conic gradient rotated behind a 1px ring, so only a transform animates.",
  ],
};
