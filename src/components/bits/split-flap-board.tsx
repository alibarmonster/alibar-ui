"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const WORDS = ["ONLINE", "SHADER", "DEPLOY", "ACTIVE", "COMMIT"];

export interface SplitFlapBoardProps {
  words?: string[];
  intervalMs?: number;
  className?: string;
}

export function SplitFlapBoard({
  words = WORDS,
  intervalMs = 3200,
  className,
}: SplitFlapBoardProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [words.length, intervalMs]);

  const current = words[index].padEnd(6, " ").slice(0, 6);

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center gap-3 p-5 rounded-2xl bg-[#111114] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]",
        className
      )}
    >
      <div className="flex items-center gap-1.5" aria-live="polite">
        {current.split("").map((char, i) => (
          <div
            key={i}
            className="relative w-10 h-14 rounded-lg bg-[#09090b] border border-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden select-none"
          >
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/80 z-20" />
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`${i}-${char}`}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 28,
                  delay: i * 0.035,
                }}
                className="font-mono text-xl font-bold text-[#c8ff4d] tracking-tighter"
              >
                {char}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setIndex((i) => (i + 1) % words.length)}
        className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded bg-white/5 border border-white/10 cursor-pointer transition"
      >
        FLIP NEXT ↻
      </button>
    </div>
  );
}
