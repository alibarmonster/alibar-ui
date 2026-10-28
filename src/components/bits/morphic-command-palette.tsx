"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const COMMANDS = [
  { id: "glsl", label: "Compile Fragment Shader", shortcut: "⌘G", group: "GPU" },
  { id: "bench", label: "Run Frame-Time Profiler", shortcut: "⌘P", group: "GPU" },
  { id: "copy", label: "Copy Registry Snippet", shortcut: "⌘C", group: "Source" },
  { id: "sync", label: "Sync Design Tokens", shortcut: "⌘S", group: "Source" },
];

export interface MorphicCommandPaletteProps {
  className?: string;
}

export function MorphicCommandPalette({ className }: MorphicCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const layoutId = useId();

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={cn("relative w-full max-w-sm flex justify-center", className)}>
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="trigger"
            layoutId={layoutId}
            type="button"
            onClick={() => {
              setOpen(true);
              setSelected(0);
            }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.55 }}
            className="flex items-center justify-between gap-6 px-4 py-2.5 rounded-xl bg-[#111114] hover:bg-[#16161b] border border-white/12 text-xs text-zinc-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#c8ff4d]"
          >
            <span className="flex items-center gap-2 font-mono">
              <span className="h-2 w-2 rounded-full bg-[#c8ff4d]" />
              <span>Run Command...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/5 border border-white/10 text-zinc-400">
              ⌘K
            </kbd>
          </motion.button>
        ) : (
          <motion.div
            key="panel"
            layoutId={layoutId}
            role="dialog"
            aria-label="Command Palette"
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.55 }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelected((s) => (s + 1) % Math.max(1, filtered.length));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelected((s) =>
                  (s - 1 + Math.max(1, filtered.length)) % Math.max(1, filtered.length)
                );
              }
              if (e.key === "Enter" && filtered[selected]) {
                setOpen(false);
              }
            }}
            className="w-full rounded-2xl bg-[#111114] border border-white/15 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center px-3.5 py-2.5 border-b border-white/10 gap-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(0);
                }}
                placeholder="Type a command..."
                className="w-full bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 hover:text-white cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div className="p-1.5 max-h-44 overflow-y-auto">
              {filtered.map((cmd, idx) => {
                const isSel = idx === selected;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onMouseEnter={() => setSelected(idx)}
                    onClick={() => setOpen(false)}
                    className="relative w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left cursor-pointer"
                  >
                    {isSel && (
                      <motion.span
                        layoutId={`${layoutId}-sel`}
                        transition={{ type: "spring", stiffness: 460, damping: 30, mass: 0.5 }}
                        className="absolute inset-0 rounded-lg bg-white/8 border border-white/10"
                      />
                    )}
                    <span className="relative z-10 text-zinc-200">{cmd.label}</span>
                    <span className="relative z-10 font-mono text-[10px] text-[#c8ff4d]">
                      {cmd.shortcut}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
