"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

export interface KineticPressureTextProps {
  text?: string;
  className?: string;
}

function KineticChar({
  char,
  index,
  mouseX,
}: {
  char: string;
  index: number;
  mouseX: ReturnType<typeof useMotionValue<number>>;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const scaleY = useSpring(1, { stiffness: 420, damping: 24 });
  const y = useSpring(0, { stiffness: 420, damping: 24 });

  return (
    <motion.span
      ref={ref}
      onMouseMove={() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const dist = Math.abs(mouseX.get() - center);
        const factor = Math.max(0, 1 - dist / 140);
        scaleY.set(1 + factor * 0.55);
        y.set(-factor * 8);
      }}
      style={{ scaleY, y }}
      data-index={index}
      className="inline-block origin-bottom font-mono font-extrabold text-2xl sm:text-3xl tracking-tight text-zinc-100 hover:text-[#c8ff4d] transition-colors select-none"
    >
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
}

export function KineticPressureText({
  text = "KINETIC WAVEFORM",
  className,
}: KineticPressureTextProps) {
  const mouseX = useMotionValue(-1000);
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={containerRef}
      onPointerMove={(e) => {
        mouseX.set(e.clientX);
        if (!containerRef.current) return;
        const spans = containerRef.current.querySelectorAll("span[data-index]");
        spans.forEach((el) => {
          const ev = new MouseEvent("mousemove", { bubbles: false });
          el.dispatchEvent(ev);
        });
      }}
      onPointerLeave={() => {
        mouseX.set(-1000);
        if (!containerRef.current) return;
        const spans = containerRef.current.querySelectorAll("span[data-index]");
        spans.forEach((el) => {
          const ev = new MouseEvent("mousemove", { bubbles: false });
          el.dispatchEvent(ev);
        });
      }}
      className={cn(
        "inline-flex flex-col items-center gap-3 px-6 py-5 rounded-2xl bg-[#111114] border border-white/10 cursor-ew-resize",
        className
      )}
    >
      <div className="flex items-center">
        {text.split("").map((ch, i) => (
          <KineticChar key={i} char={ch} index={i} mouseX={mouseX} />
        ))}
      </div>
      <span className="text-[10px] font-mono text-zinc-500 tracking-widest">
        SWEEP CURSOR ACROSS GLYPHS
      </span>
    </div>
  );
}
