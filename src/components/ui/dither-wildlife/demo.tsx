"use client";

import { DitherWildlife } from "@/components/ui/dither-wildlife/dither-wildlife";

export function Horses() {
  return (
    <DitherWildlife className="h-[480px] w-full rounded-2xl border border-black/5">
      <div className="flex max-w-md flex-col gap-4 p-10">
        <p className="font-mono text-[11px] tracking-[0.14em] text-[#6f6f6f] uppercase">Field notes / 01</p>
        <h3 className="text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.08] font-semibold tracking-tight text-[#1c1c1c]">Run with the herd.</h3>
        <p className="text-[15px] leading-relaxed text-[#5a5a5a]">An ASCII gallop in four gray inks, shaded and dithered live on a canvas.</p>
      </div>
    </DitherWildlife>
  );
}

export function Flock() {
  return <DitherWildlife scene="birds" className="h-96 w-full rounded-2xl border border-black/5" />;
}

export function Grove() {
  return <DitherWildlife scene="grove" className="h-96 w-full rounded-2xl border border-black/5" />;
}

export function Pixels() {
  return <DitherWildlife look="dither" scene="grove" className="h-96 w-full rounded-2xl border border-black/5" />;
}

export function Sepia() {
  return <DitherWildlife tones={["#e3cfa8", "#c49a62", "#8a5d34", "#4a2f1a"]} background="#fbf4e6" className="h-96 w-full rounded-2xl" />;
}
