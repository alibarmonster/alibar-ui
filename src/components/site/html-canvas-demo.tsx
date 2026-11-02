"use client";

import { useState, type ReactNode } from "react";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import { HtmlCanvasStatusChip } from "@/components/site/html-canvas-status";
import type { HtmlCanvasMode } from "@/lib/html-canvas/use-html-canvas";

/**
 * Demo-only frame for HTML in Canvas components: a Native / Fallback switch (so the fallback can be
 * compared even where the API works) and a chip with the mode the component actually rendered in.
 */
export function HtmlCanvasDemo({ children, className }: { children: (props: { rendering: HtmlCanvasMode; onModeChange: (native: boolean) => void }) => ReactNode; className?: string }) {
  const [mode, setMode] = useState<"auto" | "fallback">("auto");
  const [native, setNative] = useState(false);
  return (
    <div className={className ?? "flex w-full flex-col items-center gap-4"}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <DemoStateSwitcher<"auto" | "fallback">
          label="Rendering"
          states={[
            { value: "auto", label: "Native" },
            { value: "fallback", label: "Fallback" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <HtmlCanvasStatusChip native={native} />
      </div>
      {children({ rendering: mode, onModeChange: setNative })}
    </div>
  );
}
