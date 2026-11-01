import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ChatBubbles } from "@/components/ui/chat-bubbles/chat-bubbles";

export function Conversation({ messages, typing }: { messages: ChatMessage[]; typing: boolean }) {
  return (
    <div className="h-96 overflow-y-auto">
      <ChatBubbles messages={messages} typing={typing} />
    </div>
  );
}`,
  a11y: [
    "A polite log: new messages are announced as they arrive, each prefixed with who sent it (“You:”, “Assistant:”).",
    "The typing indicator is announced as “Assistant is typing” and its dots are decorative.",
    "With reduced motion enabled, messages fade in and the typing dots pulse instead of bouncing.",
  ],
  notes: [
    "New messages spring up from their sender's side; messages already present on first render don't animate.",
    "Consecutive messages from the same sender group together with tighter inner corners, and the list re-flows with layout animation when the typing indicator comes and goes.",
    "Scrolling is up to you: put it in a scroll container and scroll to the bottom when messages change (see the demo).",
  ],
};
