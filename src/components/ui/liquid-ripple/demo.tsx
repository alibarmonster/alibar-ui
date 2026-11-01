"use client";

import { LiquidRipple } from "@/components/ui/liquid-ripple/liquid-ripple";

export function Default() {
  return (
    <LiquidRipple className="grid h-72 w-full max-w-xl cursor-pointer place-items-center rounded-2xl select-none">
      <p className="pointer-events-none text-sm font-medium text-sky-900/70">Move across or click the surface</p>
    </LiquidRipple>
  );
}

export function Mint() {
  return <LiquidRipple className="h-60 w-full max-w-md rounded-2xl" color="#A7F3D0" backgroundColor="#F0FDF8" strength={1.3} />;
}
