"use client";

import { studioPeople } from "@/components/site/studio-images";
import { FlowLineChatCard, type FlowChatMessage } from "@/components/ui/flow-line-chat-card/flow-line-chat-card";

const portrait = (id: string) => studioPeople.find((p) => p.id === id)?.portrait;

const messages: FlowChatMessage[] = [
  { id: "a", author: "Maya", avatar: portrait("maya"), time: "9:41", text: "Pushed the new onboarding flow to staging.", reactions: [{ emoji: "🚀", count: 4 }] },
  { id: "b", author: "Jonas", avatar: portrait("jonas"), time: "9:42", text: "The step transitions feel really smooth now.", reactions: [{ emoji: "🔥", count: 3 }] },
  { id: "c", author: "Sana", text: "Sana joined the server", system: true },
  { id: "d", author: "Lena", avatar: portrait("lena"), time: "9:44", text: "Could the progress bar be a little bouncier?" },
  { id: "e", author: "Raka", avatar: portrait("raka"), time: "9:45", text: "On it, shipping a spring preset tonight.", reactions: [{ emoji: "💙", count: 5 }] },
];

export function Channel() {
  return <FlowLineChatCard messages={messages} channel={{ name: "launch-room", members: 42 }} />;
}

export function Default() {
  return <FlowLineChatCard />;
}
