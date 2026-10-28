"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const GLYPHS = "01#$%&*+<>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export interface HyperCipherTextProps {
  phrases?: string[];
  className?: string;
}

export function HyperCipherText({
  phrases = [
    "ZERO-OVERHEAD GLSL PIPELINES",
    "SUB-MILLISECOND STATE GRAPH",
    "DETERMINISTIC SPRING PHYSICS",
  ],
  className,
}: HyperCipherTextProps) {
  const [idx, setIdx] = useState(0);
  const [display, setDisplay] = useState(phrases[0]);
  const [lockedCount, setLockedCount] = useState(phrases[0].length);

  const scrambleTo = useCallback((target: string) => {
    let iteration = 0;
    const interval = setInterval(() => {
      iteration += 0.65;
      const locked = Math.floor(iteration);
      setLockedCount(locked);

      const next = target
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          if (i < locked) return target[i];
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join("");

      setDisplay(next);
      if (locked >= target.length) clearInterval(interval);
    }, 24);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return scrambleTo(phrases[idx]);
  }, [idx, phrases, scrambleTo]);

  return (
    <div
      onClick={() => setIdx((i) => (i + 1) % phrases.length)}
      onMouseEnter={() => scrambleTo(phrases[idx])}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIdx((i) => (i + 1) % phrases.length);
        }
      }}
      className={cn(
        "group inline-flex flex-col items-center gap-3 p-6 rounded-2xl bg-[#111114] border border-white/10 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#c8ff4d]",
        className
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
        <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff4d]" />
        <span>CLICK OR HOVER TO RE-CIPHER</span>
      </div>

      <motion.div
        layout
        className="font-mono text-base sm:text-lg font-bold tracking-tight text-center"
      >
        {display.split("").map((ch, i) => (
          <span
            key={i}
            className={
              i < lockedCount
                ? "text-zinc-100 transition-colors"
                : "text-[#c8ff4d] drop-shadow-[0_0_8px_rgba(200,255,77,0.8)]"
            }
          >
            {ch}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
