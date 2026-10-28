"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface TactileKnobProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  label?: string;
  unit?: string;
  onChange?: (value: number) => void;
  className?: string;
}

export function TactileKnob({
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 64,
  label = "RESONANCE",
  unit = "%",
  onChange,
  className,
}: TactileKnobProps) {
  const [value, setValue] = useState(defaultValue);
  const startY = useRef<number | null>(null);
  const startVal = useRef<number>(defaultValue);

  const clamp = (v: number) => {
    const stepped = Math.round(v / step) * step;
    return Math.min(max, Math.max(min, stepped));
  };

  const update = (next: number) => {
    const c = clamp(next);
    setValue(c);
    onChange?.(c);
  };

  const pct = (value - min) / Math.max(1, max - min);
  const angle = -135 + pct * 270;

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center gap-4 select-none p-5 rounded-2xl bg-[#111114] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]",
        className
      )}
    >
      <div className="flex items-center justify-between w-full gap-6 text-[11px] font-mono tracking-widest text-zinc-400">
        <span>{label}</span>
        <span className="text-[#c8ff4d]">
          {value}
          {unit}
        </span>
      </div>

      <div className="relative flex items-center justify-center w-28 h-28">
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="4"
            strokeDasharray="198 264"
            strokeDashoffset="-33"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#c8ff4d"
            strokeWidth="4"
            strokeDasharray={`${pct * 198} 264`}
            strokeDashoffset="-33"
            strokeLinecap="round"
          />
        </svg>

        <div
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowRight") {
              e.preventDefault();
              update(value + step);
            } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
              e.preventDefault();
              update(value - step);
            }
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            startY.current = e.clientY;
            startVal.current = value;
          }}
          onPointerMove={(e) => {
            if (startY.current === null) return;
            const dy = startY.current - e.clientY;
            const delta = (dy / 140) * (max - min);
            update(startVal.current + delta);
          }}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            startY.current = null;
          }}
          className="relative w-20 h-20 rounded-full cursor-ns-resize bg-gradient-to-b from-zinc-800 to-zinc-950 border border-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] focus-visible:outline-2 focus-visible:outline-[#c8ff4d] flex items-center justify-center"
        >
          <motion.div
            className="w-full h-full rounded-full relative"
            animate={{ rotate: angle }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
          >
            <span className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-3.5 rounded-full bg-[#c8ff4d] shadow-[0_0_8px_#c8ff4d]" />
          </motion.div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => update(value - step * 5)}
          className="px-2.5 py-1 text-xs font-mono rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 cursor-pointer transition"
        >
          -5
        </button>
        <div className="overflow-hidden h-6 px-3 flex items-center bg-black/50 rounded border border-white/10 font-mono text-xs text-white">
          <motion.span
            key={value}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
          >
            {String(value).padStart(3, "0")}
          </motion.span>
        </div>
        <button
          type="button"
          onClick={() => update(value + step * 5)}
          className="px-2.5 py-1 text-xs font-mono rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 cursor-pointer transition"
        >
          +5
        </button>
      </div>
    </div>
  );
}
