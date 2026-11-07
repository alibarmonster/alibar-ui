"use client";

import { FlowLineChatCard } from "@/components/ui/flow-line-chat-card/flow-line-chat-card";
import { MultiplayerCanvasCard } from "@/components/ui/multiplayer-canvas-card/multiplayer-canvas-card";

export function Default() {
  return <MultiplayerCanvasCard />;
}

export function CustomTeam() {
  return (
    <MultiplayerCanvasCard
      title="Review boards, together"
      description="See who is where, and what they are changing, as it happens."
      collaborators={[
        { name: "Aiko", color: "#a855f7" },
        { name: "Tomas", color: "#eab308" },
        { name: "Felix", color: "#14b8a6" },
      ]}
    />
  );
}

export function SideBySide() {
  return (
    <div className="grid w-full justify-items-center gap-5 rounded-[28px] bg-[#04070e] p-6 md:grid-cols-2">
      <FlowLineChatCard />
      <MultiplayerCanvasCard />
    </div>
  );
}
