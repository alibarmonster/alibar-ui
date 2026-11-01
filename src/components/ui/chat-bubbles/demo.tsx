"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ChatBubbles, type ChatMessage } from "@/components/ui/chat-bubbles/chat-bubbles";

const SCRIPT: Omit<ChatMessage, "id">[] = [
  { role: "user", content: "Can you move my 3pm with Lena?" },
  { role: "assistant", content: "Sure. She's free at 4:30 today or 10:00 tomorrow." },
  { role: "assistant", content: "Want me to send the invite for one of those?", time: "2:14 PM" },
  { role: "user", content: "Tomorrow at 10 works." },
  { role: "user", content: "Add a short agenda too.", time: "2:15 PM" },
  { role: "assistant", content: "Done. Invite sent for tomorrow 10:00, with a three-point agenda attached.", time: "2:15 PM" },
];

export function Default() {
  const [count, setCount] = useState(1);
  const [typing, setTyping] = useState(false);
  const [run, setRun] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  // Play the script: assistant replies arrive after a short typing pause.
  useEffect(() => {
    if (count >= SCRIPT.length) return;
    const next = SCRIPT[count];
    const pause = next.role === "assistant" ? 700 : 1100;
    const t1 = window.setTimeout(() => setTyping(next.role === "assistant"), pause);
    const t2 = window.setTimeout(() => { setTyping(false); setCount((c) => c + 1); }, pause + (next.role === "assistant" ? 1300 : 300));
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [count, run]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [count, typing]);

  const messages = SCRIPT.slice(0, count).map((m, i) => ({ ...m, id: `${run}-${i}` }));
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div ref={scroller} className="h-80 overflow-y-auto rounded-2xl border border-border bg-background p-4">
        <ChatBubbles messages={messages} typing={typing} />
      </div>
      <button
        type="button"
        onClick={() => { setCount(1); setTyping(false); setRun((r) => r + 1); }}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 self-start rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs hover:bg-accent"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Replay conversation
      </button>
    </div>
  );
}
