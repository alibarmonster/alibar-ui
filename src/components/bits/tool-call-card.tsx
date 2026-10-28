"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface ToolCallCardProps {
  toolName?: string;
  args?: Record<string, unknown>;
  output?: Record<string, unknown>;
  latencyMs?: number;
  className?: string;
}

export function ToolCallCard({
  toolName = "webgl.compile_shader",
  args = { target: "webgl2", precision: "highp", dprCap: 2.0 },
  output = { status: "linked", uniforms: 4, vramBytes: 0 },
  latencyMs = 18,
  className,
}: ToolCallCardProps) {
  const [tab, setTab] = useState<"payload" | "result">("result");

  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl bg-[#111114] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] overflow-hidden font-mono text-xs",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#5eead4] shadow-[0_0_8px_#5eead4]" />
          <span className="text-zinc-200 font-semibold">{toolName}()</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-[#c8ff4d]/10 text-[#c8ff4d] text-[10px]">
          200 OK · {latencyMs}ms
        </span>
      </div>

      <div className="flex items-center gap-1 px-3 pt-2 border-b border-white/10 bg-[#0c0c0f]">
        {(["result", "payload"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "relative px-3 py-1.5 text-[11px] uppercase tracking-wider cursor-pointer transition",
              tab === t ? "text-[#c8ff4d]" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab === t && (
              <motion.span
                layoutId="tool-card-underline"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-[#c8ff4d]"
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
              />
            )}
            {t}
          </button>
        ))}
      </div>

      <pre className="p-4 text-[11px] text-zinc-300 bg-[#09090b]/60 overflow-x-auto leading-relaxed">
        {JSON.stringify(tab === "payload" ? args : output, null, 2)}
      </pre>
    </div>
  );
}
