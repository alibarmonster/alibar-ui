"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { CloudShader } from "@/components/ui/cloud-shader/cloud-shader";

export function Hero() {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <CloudShader className="w-full rounded-xl" interactive>
      <div className="flex flex-col items-center px-6 pt-14 pb-8 text-center">
        <p className="rounded-full border border-white/70 bg-white/60 px-3 py-1 text-xs font-medium text-sky-900 backdrop-blur">New: offline sync</p>
        <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-4xl">Your roadmap, above the clouds</h2>
        <p className="mt-3 max-w-sm text-[15px] leading-7 text-slate-600">Plan, ship and celebrate in one calm workspace.</p>
        <div className="mt-6 flex gap-2">
          <a href="#start" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-slate-900 px-4 text-sm font-medium text-white">
            Start free <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <a href="#tour" className="inline-flex h-10 items-center rounded-full border border-white/80 bg-white/70 px-4 text-sm font-medium text-slate-900 backdrop-blur">
            Take the tour
          </a>
        </div>
        <motion.div
          aria-hidden="true"
          className="mt-10 w-full max-w-md overflow-hidden rounded-xl border border-white/80 bg-white/85 shadow-xl backdrop-blur"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, ease: "easeInOut", repeat: reduceMotion ? 0 : Infinity }}
        >
          <div className="flex items-center gap-1.5 border-b border-slate-200/70 px-3 py-2">
            <span className="size-2 rounded-full bg-slate-300" />
            <span className="size-2 rounded-full bg-slate-300" />
            <span className="size-2 rounded-full bg-slate-300" />
          </div>
          <div className="grid grid-cols-[5rem_1fr] gap-3 p-3">
            <div className="space-y-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-2 rounded-full bg-slate-200" />
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-3 w-1/2 rounded-full bg-slate-300" />
              <div className="h-16 rounded-lg bg-sky-100" />
              <div className="h-2 w-3/4 rounded-full bg-slate-200" />
            </div>
          </div>
        </motion.div>
      </div>
    </CloudShader>
  );
}

export function WindowSeat() {
  return (
    <figure className="flex flex-col items-center gap-3">
      <div className="rounded-[46%/38%] bg-gradient-to-b from-zinc-100 to-zinc-200 p-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.12),0_10px_30px_-12px_rgba(0,0,0,0.25)]">
        <CloudShader className="h-64 w-48 rounded-[46%/38%] shadow-[inset_0_0_24px_rgba(0,0,0,0.18)]" quality="low" density={5} fadeToBackground={false} speed={2.5} />
      </div>
      <figcaption className="text-[13px] text-muted-foreground">Window seat · 34A</figcaption>
    </figure>
  );
}

export function DeepBlue() {
  return (
    <CloudShader
      className="grid h-72 w-full place-items-center rounded-xl"
      skyTopColor="#1E3A8A"
      skyBottomColor="#60A5FA"
      cloudColor="#F8FAFC"
      density={3}
      fadeToBackground={false}
    >
      <p className="text-2xl font-semibold tracking-tight text-white drop-shadow">Clear skies ahead</p>
    </CloudShader>
  );
}
