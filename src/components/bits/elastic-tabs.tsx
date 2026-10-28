"use client";

import { useState, useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface ElasticTabsProps {
  tabs?: string[];
  defaultTab?: string;
  onChange?: (tab: string) => void;
  className?: string;
}

export function ElasticTabs({
  tabs = ["Shaders", "Tactile", "Telemetry", "Compute"],
  defaultTab,
  onChange,
  className,
}: ElasticTabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]);
  const [hovered, setHovered] = useState<string | null>(null);
  const id = useId();

  const select = (t: string) => {
    setActive(t);
    onChange?.(t);
  };

  return (
    <div
      role="tablist"
      aria-label="Component category tabs"
      className={cn(
        "inline-flex items-center p-1.5 rounded-xl bg-[#111114] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]",
        className
      )}
      onMouseLeave={() => setHovered(null)}
    >
      {tabs.map((tab) => {
        const isActive = active === tab;
        const isHovered = hovered === tab;
        return (
          <button
            key={tab}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => select(tab)}
            onMouseEnter={() => setHovered(tab)}
            className={cn(
              "relative px-4 py-2 text-xs font-medium tracking-wide rounded-lg transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#c8ff4d]",
              isActive ? "text-black font-semibold" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            {isHovered && !isActive && (
              <motion.span
                layoutId={`${id}-hover`}
                className="absolute inset-0 rounded-lg bg-white/5"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {isActive && (
              <motion.span
                layoutId={`${id}-pill`}
                className="absolute inset-0 rounded-lg bg-[#c8ff4d] shadow-[0_0_20px_rgba(200,255,77,0.35)]"
                transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.7 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        );
      })}
    </div>
  );
}
