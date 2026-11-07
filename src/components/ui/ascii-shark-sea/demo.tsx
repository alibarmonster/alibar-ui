"use client";

import { AsciiSharkSea } from "@/components/ui/ascii-shark-sea/ascii-shark-sea";

export function Hero() {
  return (
    <AsciiSharkSea className="h-[520px] w-full rounded-2xl border border-border">
      <div className="pointer-events-none flex h-full flex-col justify-start bg-[linear-gradient(100deg,rgb(238_248_249/0.92),rgb(238_248_249/0.55)_40%,transparent_65%)] p-8 sm:p-10">
        <p className="font-mono text-[11px] tracking-[0.14em] text-[#46687b] uppercase">Open water / survey 07</p>
        <h3 className="mt-3 max-w-md font-sans text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.08] font-semibold tracking-tight text-[#10293a]">
          Something big is passing below.
        </h3>
        <p className="mt-3 max-w-sm font-sans text-[15px] leading-relaxed text-[#2f5163]">
          Hammerheads, a great white and a reef shark on patrol. Move the cursor to herd the fish, or click to drop bait.
        </p>
      </div>
    </AsciiSharkSea>
  );
}

export function Night() {
  return (
    <AsciiSharkSea
      palette="dark"
      sharks={[{ kind: "great-white", size: 1.2 }, { kind: "reef" }, { kind: "reef", size: 0.8 }, { kind: "hammerhead" }]}
      schools={4}
      className="h-[460px] w-full rounded-2xl"
    />
  );
}

export function Hammerheads() {
  return (
    <AsciiSharkSea
      sharks={[{ kind: "hammerhead", size: 1.3 }, { kind: "hammerhead" }, { kind: "hammerhead", size: 0.75 }]}
      schools={2}
      fishPerSchool={12}
      cell={10}
      palette={{ base: "light", surface: "#f2f7ee", deep: "#b7d8c4", shark: "#20392c", sharkMid: "#4b6b58", fish: "#d2691e" }}
      className="h-[420px] w-full rounded-2xl"
    />
  );
}

export function Default() {
  return <AsciiSharkSea className="w-full rounded-2xl" />;
}
