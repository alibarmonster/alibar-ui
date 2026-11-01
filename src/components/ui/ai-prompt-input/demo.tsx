"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { AIPromptInput } from "@/components/ui/ai-prompt-input/ai-prompt-input";

export function Default() {
  const [sent, setSent] = useState<{ text: string; files: number }[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setLoading(false), 3000);
    return () => window.clearTimeout(timer);
  }, [loading]);
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      {sent.length ? (
        <ul className="space-y-1.5 text-sm">
          {sent.slice(-3).map((m, i) => (
            <li key={i} className="ml-auto w-fit max-w-[80%] rounded-2xl bg-muted px-3.5 py-2 text-foreground">
              {m.text || <span className="text-muted-foreground">(attachments only)</span>}
              {m.files ? <span className="ml-2 text-xs text-muted-foreground">+{m.files} file{m.files > 1 ? "s" : ""}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <AIPromptInput
        loading={loading}
        onStop={() => setLoading(false)}
        onSubmit={(text, attachments) => {
          setSent((s) => [...s, { text, files: attachments.length }]);
          setLoading(true);
        }}
        toolbar={
          <button type="button" className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[13px] text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Fast model
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </button>
        }
      />
      <p className="text-xs text-muted-foreground">Enter to send · Shift+Enter for a new line · drop files to attach</p>
    </div>
  );
}
