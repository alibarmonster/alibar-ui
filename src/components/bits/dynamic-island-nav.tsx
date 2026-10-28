"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

type NotchState = "idle" | "compiling" | "deployed";

export function DynamicIslandNav({ className }: { className?: string }) {
  const [state, setState] = useState<NotchState>("idle");

  const cycle = () => {
    setState((s) =>
      s === "idle" ? "compiling" : s === "compiling" ? "deployed" : "idle"
    );
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.6 }}
        onClick={cycle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cycle();
          }
        }}
        className="relative overflow-hidden rounded-3xl bg-[#09090b] border border-white/15 shadow-[0_16px_36px_rgba(0,0,0,0.75),inset_0_1px_0_0_rgba(255,255,255,0.12)] cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#c8ff4d]"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-4 px-4 py-2"
            >
              <span className="h-2 w-2 rounded-full bg-[#c8ff4d]" />
              <span className="font-mono text-xs text-zinc-200">
                alibar.node
              </span>
              <span className="font-mono text-[10px] text-zinc-500">99.98%</span>
            </motion.div>
          )}

          {state === "compiling" && (
            <motion.div
              key="compiling"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center justify-between gap-6 px-5 py-3 min-w-[270px]"
            >
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full border-2 border-[#5eead4] border-t-transparent animate-spin" />
                <div>
                  <div className="text-xs font-medium text-zinc-100">
                    Linking GLSL Pipeline
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400">
                    4 uniforms · 0B texture
                  </div>
                </div>
              </div>
              <span className="font-mono text-xs text-[#5eead4]">68%</span>
            </motion.div>
          )}

          {state === "deployed" && (
            <motion.div
              key="deployed"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="flex flex-col gap-2.5 px-5 py-3.5 min-w-[300px]"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#c8ff4d]">
                  <span className="h-2 w-2 rounded-full bg-[#c8ff4d] shadow-[0_0_8px_#c8ff4d]" />
                  Edge Artifact Live
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
                  14ms RTT
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-white/10 pt-2">
                <span>sha256:9b73aa8</span>
                <span className="text-zinc-200">SIN-01 → ACTIVE</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <span className="text-[10px] font-mono text-zinc-500">
        CLICK ISLAND TO MORPH STATE ({state.toUpperCase()})
      </span>
    </div>
  );
}
