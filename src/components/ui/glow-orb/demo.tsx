"use client";

import { useEffect, useState } from "react";
import { GlowOrb, type OrbState } from "@/components/ui/glow-orb/glow-orb";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";

// A fake audio level: smooth pulses while listening or speaking.
function useFakeLevel(active: boolean) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!active) return;
    let t = 0;
    const timer = window.setInterval(() => {
      t += 1;
      setLevel(Math.abs(Math.sin(t * 0.7) * 0.6 + Math.sin(t * 1.9) * 0.3));
    }, 120);
    return () => window.clearInterval(timer);
  }, [active]);
  return active ? level : 0;
}

export function Default() {
  const [state, setState] = useState<OrbState>("idle");
  const level = useFakeLevel(state === "listening" || state === "speaking");
  return (
    <div className="flex flex-col items-center gap-4">
      <GlowOrb state={state} level={level} className="w-56" />
      <DemoStateSwitcher<OrbState> states={["idle", "listening", "thinking", "speaking"]} value={state} onChange={setState} label="Assistant state" />
    </div>
  );
}

export function Mint() {
  return <GlowOrb className="w-40" innerColor="#A7F3D0" outerColor="#0D9488" state="thinking" />;
}
