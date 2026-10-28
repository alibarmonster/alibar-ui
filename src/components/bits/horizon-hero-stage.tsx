"use client";

import { motion } from "motion/react";
import { CausticBeams } from "@/components/bits/caustic-beams";
import { HyperCipherText } from "@/components/bits/hyper-cipher-text";
import { HapticMicroButton } from "@/components/bits/haptic-micro-button";
import { cn } from "@/lib/utils";

export function HorizonHeroStage({
  speed = 1,
  className,
}: {
  speed?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full h-full min-h-[280px] overflow-hidden flex flex-col justify-between p-6 bg-[#09090b]",
        className
      )}
    >
      <div className="absolute inset-0 opacity-75 pointer-events-none">
        <CausticBeams speed={speed} intensity={1.1} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-zinc-400">
        <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[#c8ff4d]">
          SYS.HERO // 60FPS
        </span>
        <span>LATENCY 0.4ms</span>
      </div>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative z-10 space-y-3 my-auto py-2"
      >
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Autonomous Shader &amp; Motion Infrastructure
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <HapticMicroButton />
        </div>
      </motion.div>

      <div className="relative z-10 hidden sm:block">
        <HyperCipherText
          phrases={["WEBGL2 NATIVE STAGE", "ZERO RUNTIME BLOAT"]}
          className="p-2.5 bg-black/60 backdrop-blur-md border-white/10"
        />
      </div>
    </div>
  );
}
