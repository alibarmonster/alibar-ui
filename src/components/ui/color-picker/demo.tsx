"use client";

import { useState } from "react";
import { ColorPicker } from "@/components/ui/color-picker/color-picker";

export function Default() {
  const [color, setColor] = useState("#2563eb");
  return (
    <div className="flex flex-col items-center gap-3">
      <ColorPicker value={color} onValueChange={setColor} />
      <p className="font-mono text-xs text-muted-foreground uppercase">{color}</p>
    </div>
  );
}

const LABEL_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7"];

export function SwatchesOnly() {
  const [color, setColor] = useState(LABEL_COLORS[4]);
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-3">
      <span
        className="inline-flex h-7 items-center rounded-full px-3 text-[13px] font-medium text-white"
        style={{ backgroundColor: color }}
      >
        Design review
      </span>
      <ColorPicker
        label="Label color"
        value={color}
        onValueChange={setColor}
        swatches={LABEL_COLORS}
        showHue={false}
        showInput={false}
        className="max-w-[15rem] p-3 shadow-sm"
      />
    </div>
  );
}

const BRAND = ["#0f172a", "#334155", "#64748b", "#e2e8f0", "#f97316", "#ea580c"];

export function Brand() {
  return <ColorPicker label="Brand colors" defaultValue="#f97316" swatches={BRAND} />;
}
