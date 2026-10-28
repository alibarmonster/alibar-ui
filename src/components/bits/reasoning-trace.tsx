"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export interface TraceStep {
  label: string;
  detail: string;
  durationMs: number;
}

const DEFAULT_STEPS: TraceStep[] = [
  {
    label: "Compile GLSL fragment pipeline",
    detail: "Linked WebGL2 fullscreen triangle strip with 0 VRAM texture overhead",
    durationMs: 14,
  },
  {
    label: "Verify spring dynamics & ARIA contract",
    detail: "Stiffness=380, Damping=26; keyboard spinbutton & tablist bindings active",
    durationMs: 28,
  },
  {
    label: "Bind IntersectionObserver governor",
    detail: "Offscreen canvas contexts automatically suspended at <5% visibility",
    durationMs: 9,
  },
];

export interface ReasoningTraceProps {
  title?: string;
  steps?: TraceStep[];
  className?: string;
}

export function ReasoningTrace({
  title = "Synthesizing shader & motion graph",
  steps = DEFAULT_STEPS,
  className,
}: ReasoningTraceProps) {
  const [open, setOpen] = useState(true);
  const totalMs = steps.reduce((acc, s) => acc + s.durationMs, 0);

  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl bg-[#111114] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] overflow-hidden",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left cursor-pointer hover:bg-white/[0.03] transition"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8ff4d] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#c8ff4d]" />
          </span>
          <span className="text-xs font-medium text-zinc-200">{title}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <span>{totalMs}ms</span>
          <motion.svg
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="w-3.5 h-3.5 text-zinc-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="border-t border-white/10"
          >
            <div className="p-4 space-y-3">
              {steps.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ x: -8, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative pl-4 border-l border-white/15"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-200">{step.label}</span>
                    <span className="font-mono text-[10px] text-[#5eead4]">
                      {step.durationMs}ms
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    {step.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
