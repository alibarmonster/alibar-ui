"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type ButtonState = "idle" | "arming" | "confirmed";

export function HapticMicroButton({ className }: { className?: string }) {
  const [status, setStatus] = useState<ButtonState>("idle");

  const trigger = () => {
    if (status !== "idle") return;
    setStatus("arming");
    setTimeout(() => setStatus("confirmed"), 550);
    setTimeout(() => setStatus("idle"), 2100);
  };

  return (
    <motion.button
      type="button"
      onClick={trigger}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 500, damping: 24 }}
      className={cn(
        "relative overflow-hidden px-5 py-3 rounded-xl font-mono text-xs font-semibold tracking-wider uppercase cursor-pointer select-none border transition-colors focus-visible:outline-2 focus-visible:outline-[#c8ff4d]",
        status === "confirmed"
          ? "bg-[#c8ff4d] text-black border-[#c8ff4d] shadow-[0_0_28px_rgba(200,255,77,0.45)]"
          : "bg-[#111114] text-zinc-100 border-white/15 hover:border-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]",
        className
      )}
    >
      <motion.span
        key={status}
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 450, damping: 26 }}
        className="relative z-10 flex items-center gap-2.5"
      >
        {status === "idle" && (
          <>
            <span className="h-2 w-2 rounded-full bg-[#c8ff4d]" />
            <span>Deploy Production</span>
          </>
        )}
        {status === "arming" && (
          <>
            <span className="h-2 w-2 rounded-full bg-[#5eead4] animate-ping" />
            <span className="text-[#5eead4]">Verifying Signatures...</span>
          </>
        )}
        {status === "confirmed" && (
          <>
            <span>✓ Shipped #9b73aa8</span>
          </>
        )}
      </motion.span>
    </motion.button>
  );
}
