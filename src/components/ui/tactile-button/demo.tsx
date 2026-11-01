"use client";

import { useEffect, useState } from "react";
import { Power } from "lucide-react";
import { TactileButton } from "@/components/ui/tactile-button/tactile-button";

export function Default() {
  return <TactileButton size="lg">Press me</TactileButton>;
}

export function Colors() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <TactileButton>Neutral</TactileButton>
      <TactileButton variant="dark">
        <Power aria-hidden="true" />
        Power
      </TactileButton>
      <TactileButton variant="primary">Continue</TactileButton>
    </div>
  );
}

const KEYS = ["W", "A", "S", "D"];

export function Keycaps() {
  const [down, setDown] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const update = (event: KeyboardEvent, isDown: boolean) => {
      const key = event.key.toUpperCase();
      if (!KEYS.includes(key) || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      setDown((current) => {
        const next = new Set(current);
        if (isDown) next.add(key);
        else next.delete(key);
        return next;
      });
    };
    const onDown = (event: KeyboardEvent) => update(event, true);
    const onUp = (event: KeyboardEvent) => update(event, false);
    const clear = () => setDown(new Set());
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", clear);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <TactileButton
            key={key}
            size="key"
            pressed={down.has(key) || undefined}
            className={key === "W" ? "col-start-2" : key === "A" ? "col-start-1" : undefined}
          >
            {key}
          </TactileButton>
        ))}
      </div>
      <p className="text-[13px] text-muted-foreground">Press W, A, S or D on your keyboard.</p>
    </div>
  );
}
