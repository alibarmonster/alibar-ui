"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import { StreamingText, useTextStream } from "@/components/ui/streaming-text/streaming-text";

const ANSWER = `Spring animations feel natural because they model physics instead of time. Rather than "move for 300ms", you describe stiffness and damping, and the motion settles on its own.

That's also why they can be interrupted mid-flight without a visible jump: the spring simply retargets from its current velocity.`;

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40";

export function Default() {
  const { text, streaming, restart } = useTextStream(ANSWER, { wordsPerSecond: 20 });
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="self-end rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background">Why do springs feel better than easing curves?</div>
      <div className="flex gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-xs" aria-hidden="true">
          <Sparkles className="size-3.5 text-primary" />
        </span>
        <StreamingText text={text} streaming={streaming} aria-live="polite" className="min-h-40 pt-0.5 text-sm leading-relaxed text-foreground" />
      </div>
      <button type="button" className={`${control} self-start`} onClick={restart} disabled={streaming}>
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Regenerate
      </button>
    </div>
  );
}

const CODE = `export function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle] as const;
}`;

export function ByCharacter() {
  const { text, streaming, restart } = useTextStream(CODE, { wordsPerSecond: 18 });
  return (
    <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-[12px] text-muted-foreground">
        <span className="font-mono">use-toggle.ts</span>
        <button type="button" onClick={restart} className="cursor-pointer rounded px-1.5 py-0.5 hover:bg-accent hover:text-foreground">
          Replay
        </button>
      </div>
      <StreamingText
        text={text}
        streaming={streaming}
        granularity="character"
        duration={0.35}
        blur={4}
        className="min-h-36 overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-foreground"
      />
    </div>
  );
}
