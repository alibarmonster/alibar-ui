"use client";

import { useRef, useState } from "react";
import { motion, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { id: "home", label: "Index", badge: "01" },
  { id: "shaders", label: "Shaders", badge: "02" },
  { id: "motion", label: "Physics", badge: "03" },
  { id: "deploy", label: "Ship", badge: "⌘D" },
];

function MagneticItem({
  label,
  badge,
  active,
  onClick,
}: {
  label: string;
  badge: string;
  active: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const x = useSpring(0, { stiffness: 320, damping: 20 });
  const y = useSpring(0, { stiffness: 320, damping: 20 });

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.35);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={cn(
        "relative px-3.5 py-2 rounded-xl text-xs font-mono flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#c8ff4d]",
        active ? "text-black font-semibold" : "text-zinc-300 hover:text-white"
      )}
    >
      {active && (
        <motion.span
          layoutId="dock-active-pill"
          className="absolute inset-0 rounded-xl bg-[#c8ff4d] shadow-[0_0_20px_rgba(200,255,77,0.4)]"
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
        />
      )}
      <span className="relative z-10">{label}</span>
      <span
        className={cn(
          "relative z-10 text-[9px] px-1 rounded",
          active ? "bg-black/20 text-black" : "bg-white/5 text-zinc-500"
        )}
      >
        {badge}
      </span>
    </motion.button>
  );
}

export function MagneticDock({ className }: { className?: string }) {
  const [active, setActive] = useState("shaders");

  return (
    <nav
      aria-label="Magnetic floating dock"
      className={cn(
        "inline-flex items-center gap-1 p-1.5 rounded-2xl bg-[#111114]/90 backdrop-blur-xl border border-white/12 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
        className
      )}
    >
      {ITEMS.map((item) => (
        <MagneticItem
          key={item.id}
          label={item.label}
          badge={item.badge}
          active={active === item.id}
          onClick={() => setActive(item.id)}
        />
      ))}
    </nav>
  );
}
