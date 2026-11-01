"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { VoiceOrb, type VoiceOrbState } from "@/components/ui/voice-orb/voice-orb";

const STATES: VoiceOrbState[] = ["idle", "listening", "thinking", "speaking"];

/** A speech-like level: syllable bursts with pauses, for when there's no microphone. */
function useSimulatedLevel(active: boolean) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const tick = (t: number) => {
      const s = t / 1000;
      const syllables = Math.max(0, Math.sin(s * 9.5) * Math.sin(s * 2.3 + 1));
      const phrase = Math.sin(s * 0.9) > -0.3 ? 1 : 0.1;
      setLevel(Math.min(1, syllables * phrase * 1.1));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return active ? level : 0;
}

export function Default() {
  const [state, setState] = useState<VoiceOrbState>("listening");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const simulated = useSimulatedLevel(!stream && (state === "listening" || state === "speaking"));

  const toggleMic = async () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      return;
    }
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ audio: true }));
      setState("listening");
    } catch {
      // Permission denied or no microphone: keep the simulated level.
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <VoiceOrb state={state} level={simulated} stream={stream} />
      <div className="flex flex-wrap justify-center gap-1 rounded-full border border-border bg-surface p-1" role="group" aria-label="Assistant state">
        {STATES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={state === s}
            onClick={() => setState(s)}
            className="h-8 cursor-pointer rounded-full px-3 text-[13px] font-medium text-muted-foreground capitalize outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-xs"
          >
            {s}
          </button>
        ))}
      </div>
      <button type="button" onClick={toggleMic} className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        {stream ? <MicOff className="size-3.5" aria-hidden="true" /> : <Mic className="size-3.5" aria-hidden="true" />}
        {stream ? "Stop using the microphone" : "Try it with your microphone"}
      </button>
    </div>
  );
}
