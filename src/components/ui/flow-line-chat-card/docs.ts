import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { FlowLineChatCard } from "@/components/ui/flow-line-chat-card/flow-line-chat-card";

<FlowLineChatCard
  title="Conversations that keep flowing"
  description="Channels, threads and reactions that update live."
  channel={{ name: "launch-room", members: 42 }}
  messages={[
    { id: "a", author: "Maya", text: "Pushed the new flow to staging.", reactions: [{ emoji: "🚀", count: 4 }] },
    { id: "b", author: "Sana", text: "Sana joined the server", system: true },
  ]}
/>

// The background on its own:
import { FlowLines } from "@/components/ui/flow-line-chat-card/flow-line-chat-card";`,
  a11y: [
    "Messages are a real ordered list labelled by the channel, with names, text and reactions as DOM text. Each message's toolbar (react, reply, more) shows on hover or keyboard focus and has labelled buttons.",
    "The typing indicator and flowing lines are decorative (aria-hidden). Under reduced motion every message is shown at once, nothing replays and the lines hold still.",
  ],
  notes: [
    "Messages arrive one by one after a typing indicator, reactions pop in on a spring and count up, and a system line marks someone joining; after a pause the channel replays. The sequence only runs while the card is on screen.",
    "`FlowLines` is exported for other cards (Multiplayer Canvas Card uses it): an SVG of lines whose dashes flow with CSS while a small loop reshapes the curves and bends them toward the pointer over the parent element. It pauses offscreen and in hidden tabs.",
  ],
};
